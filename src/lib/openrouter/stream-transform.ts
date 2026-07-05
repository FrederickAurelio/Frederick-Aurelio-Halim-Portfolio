import { createParser, type EventSourceMessage } from "eventsource-parser";
import type {
  OpenRouterReasoningDetail,
  OpenRouterStreamChunk,
} from "./types";

export const CHAT_SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export type GenerationEndReason = "complete" | "aborted" | "error";

export type StreamTransformHooks = {
  onThinkingDelta?: (delta: string) => void;
  onContentDelta?: (delta: string) => void;
  onSaved?: (payload: {
    userMessageId: string;
    assistantMessageId: string;
  }) => void;
};

type TransformOptions = StreamTransformHooks & {
  savedPayload?: { userMessageId: string; assistantMessageId: string };
  shouldStop?: () => boolean | Promise<boolean>;
  onGenerationEnd?: (reason: GenerationEndReason) => void | Promise<void>;
};

function encodeSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function safeEnqueue(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  event: string,
  data: unknown,
): void {
  try {
    controller.enqueue(encoder.encode(encodeSseEvent(event, data)));
  } catch {
    // Client disconnected — keep reading upstream and saving server-side.
  }
}

function extractThinkingDelta(delta: OpenRouterStreamChunk["choices"]): string {
  const d = delta?.[0]?.delta;
  if (!d) return "";

  const parts: string[] = [];

  if (typeof d.reasoning === "string" && d.reasoning) {
    parts.push(d.reasoning);
  }

  if (typeof d.reasoning_content === "string" && d.reasoning_content) {
    parts.push(d.reasoning_content);
  }

  if (Array.isArray(d.reasoning_details)) {
    for (const detail of d.reasoning_details) {
      const text = extractReasoningDetailText(detail);
      if (text) parts.push(text);
    }
  }

  return parts.join("");
}

function extractReasoningDetailText(detail: OpenRouterReasoningDetail): string {
  if (detail.type === "reasoning.text" && detail.text) {
    return detail.text;
  }

  if (detail.type === "reasoning.summary" && detail.summary) {
    return detail.summary;
  }

  return "";
}

function processOpenRouterChunk(
  chunk: OpenRouterStreamChunk,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  hooks?: StreamTransformHooks,
): string | null {
  if (chunk.error) {
    return chunk.error.message;
  }

  const thinking = extractThinkingDelta(chunk.choices);
  if (thinking) {
    hooks?.onThinkingDelta?.(thinking);
    safeEnqueue(controller, encoder, "thinking", { delta: thinking });
  }

  const content = chunk.choices?.[0]?.delta?.content;
  if (typeof content === "string" && content) {
    hooks?.onContentDelta?.(content);
    safeEnqueue(controller, encoder, "content", { delta: content });
  }

  return null;
}

export function transformOpenRouterStream(
  upstream: ReadableStream<Uint8Array> | null,
  options?: TransformOptions,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const hooks = options;

  return new ReadableStream({
    start(controller) {
      if (!upstream) {
        safeEnqueue(controller, encoder, "error", {
          message: "Empty response stream",
        });
        void options?.onGenerationEnd?.("error");
        controller.close();
        return;
      }

      const reader = upstream.getReader();
      const decoder = new TextDecoder();
      let streamError: string | null = null;
      let generationEnded = false;

      const endGeneration = async (reason: GenerationEndReason) => {
        if (generationEnded) return;
        generationEnded = true;
        await options?.onGenerationEnd?.(reason);
      };

      const parser = createParser({
        onEvent(event: EventSourceMessage) {
          if (!event.data || event.data === "[DONE]") return;

          try {
            const chunk = JSON.parse(event.data) as OpenRouterStreamChunk;
            const chunkError = processOpenRouterChunk(
              chunk,
              controller,
              encoder,
              hooks,
            );
            if (chunkError) {
              streamError = chunkError;
              void reader.cancel().catch(() => {});
            }
          } catch {
            // Ignore malformed JSON chunks
          }
        },
      });

      const pump = async () => {
        try {
          if (options?.savedPayload) {
            safeEnqueue(controller, encoder, "saved", options.savedPayload);
            hooks?.onSaved?.(options.savedPayload);
          }

          while (true) {
            if (await options?.shouldStop?.()) {
              await reader.cancel().catch(() => {});
              await endGeneration("aborted");
              safeEnqueue(controller, encoder, "done", {});
              controller.close();
              return;
            }

            if (streamError) break;

            const { done, value } = await reader.read();
            if (done) break;

            parser.feed(decoder.decode(value, { stream: true }));

            if (streamError) break;
          }

          parser.feed(decoder.decode());

          if (streamError) {
            safeEnqueue(controller, encoder, "error", { message: streamError });
            await endGeneration("error");
            controller.close();
            return;
          }

          await endGeneration("complete");
          safeEnqueue(controller, encoder, "done", {});
          controller.close();
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            await endGeneration("aborted");
            safeEnqueue(controller, encoder, "done", {});
            controller.close();
            return;
          }

          const message =
            error instanceof Error ? error.message : "Stream failed";
          safeEnqueue(controller, encoder, "error", { message });
          await endGeneration("error");
          controller.close();
        }
      };

      void pump();
    },
  });
}
