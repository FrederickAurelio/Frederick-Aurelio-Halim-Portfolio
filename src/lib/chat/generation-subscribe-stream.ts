import type { ChatStore } from "@/lib/chat-store";
import { getGenerationBufferPollMs } from "@/lib/chat-store/keys";
import type { GenerationBuffer } from "@/lib/chat/types";
import { CHAT_SSE_HEADERS } from "@/lib/openrouter/stream-transform";

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
    // Client disconnected
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function emitBufferDeltas(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  buffer: GenerationBuffer,
  lastReasoningLen: number,
  lastContentLen: number,
): { lastReasoningLen: number; lastContentLen: number } {
  const thinkingDelta = buffer.reasoning.slice(lastReasoningLen);
  const contentDelta = buffer.content.slice(lastContentLen);

  if (thinkingDelta) {
    safeEnqueue(controller, encoder, "thinking", { delta: thinkingDelta });
  }
  if (contentDelta) {
    safeEnqueue(controller, encoder, "content", { delta: contentDelta });
  }

  return {
    lastReasoningLen: buffer.reasoning.length,
    lastContentLen: buffer.content.length,
  };
}

function emitTrailingBuffer(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  buffer: GenerationBuffer | null,
  lastReasoningLen: number,
  lastContentLen: number,
): { lastReasoningLen: number; lastContentLen: number } {
  if (!buffer) {
    return { lastReasoningLen, lastContentLen };
  }

  return emitBufferDeltas(
    controller,
    encoder,
    buffer,
    lastReasoningLen,
    lastContentLen,
  );
}

function finishSubscribeStream(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  buffer: GenerationBuffer | null,
  lastReasoningLen: number,
  lastContentLen: number,
): void {
  emitTrailingBuffer(controller, encoder, buffer, lastReasoningLen, lastContentLen);
  safeEnqueue(controller, encoder, "done", {});
  controller.close();
}

type CreateSubscribeStreamOptions = {
  sessionId: string;
  store: ChatStore;
  signal?: AbortSignal;
  pollMs?: number;
};

export function createGenerationSubscribeStream(
  options: CreateSubscribeStreamOptions,
): ReadableStream<Uint8Array> {
  const { sessionId, store, signal, pollMs = getGenerationBufferPollMs() } =
    options;
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const pump = async () => {
        try {
          const buffer = await store.getGenerationBuffer(sessionId);
          if (!buffer) {
            safeEnqueue(controller, encoder, "error", {
              message: "Generation buffer not found",
            });
            controller.close();
            return;
          }

          safeEnqueue(controller, encoder, "saved", {
            userMessageId: buffer.userMessageId,
            assistantMessageId: buffer.assistantMessageId,
          });

          safeEnqueue(controller, encoder, "sync", {
            content: buffer.content,
            reasoning: buffer.reasoning,
            seq: buffer.seq,
          });

          let lastSeq = buffer.seq;
          let lastReasoningLen = buffer.reasoning.length;
          let lastContentLen = buffer.content.length;

          while (true) {
            if (signal?.aborted) break;

            const locked = await store.isGenerationLocked(sessionId);
            if (!locked) {
              const finalBuffer = await store.getGenerationBuffer(sessionId);
              finishSubscribeStream(
                controller,
                encoder,
                finalBuffer,
                lastReasoningLen,
                lastContentLen,
              );
              return;
            }

            await sleep(pollMs, signal);

            const updated = await store.getGenerationBuffer(sessionId);
            if (!updated) {
              const stillLocked = await store.isGenerationLocked(sessionId);
              if (!stillLocked) {
                finishSubscribeStream(
                  controller,
                  encoder,
                  null,
                  lastReasoningLen,
                  lastContentLen,
                );
                return;
              }
              continue;
            }

            if (updated.seq > lastSeq) {
              const next = emitBufferDeltas(
                controller,
                encoder,
                updated,
                lastReasoningLen,
                lastContentLen,
              );
              lastReasoningLen = next.lastReasoningLen;
              lastContentLen = next.lastContentLen;
              lastSeq = updated.seq;
            }
          }

          controller.close();
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            controller.close();
            return;
          }
          safeEnqueue(controller, encoder, "error", {
            message: error instanceof Error ? error.message : "Subscribe failed",
          });
          controller.close();
        }
      };

      void pump();
    },
  });
}

export { CHAT_SSE_HEADERS };
