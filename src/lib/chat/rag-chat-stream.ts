import { planRetrieval } from "@/lib/knowledge/navigator";
import { buildRagMessages } from "@/lib/knowledge/build-messages";
import { retrieveWithPlan } from "@/lib/knowledge/retrieve";
import { createChatCompletionStream } from "@/lib/openrouter/client";
import {
  pipeOpenRouterToChatStream,
  safeEnqueue,
  type GenerationEndReason,
  type StreamTransformHooks,
} from "@/lib/openrouter/stream-transform";
import type { ChatStreamPhase } from "@/lib/chat/types";
import type { OpenRouterMessage } from "@/lib/openrouter/types";

export type RagChatStreamOptions = StreamTransformHooks & {
  savedPayload: { userMessageId: string; assistantMessageId: string };
  history: OpenRouterMessage[];
  userMessage: string;
  signal?: AbortSignal;
  shouldStop?: () => boolean | Promise<boolean>;
  onStreamPhase?: (phase: ChatStreamPhase) => void;
  onGenerationEnd?: (reason: GenerationEndReason) => void | Promise<void>;
};

async function isGenerationCancelled(
  signal?: AbortSignal,
  shouldStop?: () => boolean | Promise<boolean>,
): Promise<boolean> {
  if (signal?.aborted) return true;
  if (!shouldStop) return false;
  try {
    return await shouldStop();
  } catch {
    return false;
  }
}

async function finishAborted(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  onGenerationEnd?: (reason: GenerationEndReason) => void | Promise<void>,
): Promise<void> {
  await onGenerationEnd?.("aborted");
  safeEnqueue(controller, encoder, "done", {});
  controller.close();
}

function emitStreamPhase(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  phase: ChatStreamPhase,
  onStreamPhase?: (phase: ChatStreamPhase) => void,
): void {
  onStreamPhase?.(phase);
  safeEnqueue(controller, encoder, "phase", { phase });
  if (phase === "routing" || phase === "retrieving") {
    safeEnqueue(controller, encoder, phase, {});
  }
}

export function createRagChatStream(
  options: RagChatStreamOptions,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      const run = async () => {
        const cancelled = () =>
          isGenerationCancelled(options.signal, options.shouldStop);

        try {
          safeEnqueue(controller, encoder, "saved", options.savedPayload);
          options.onSaved?.(options.savedPayload);

          if (await cancelled()) {
            await finishAborted(controller, encoder, options.onGenerationEnd);
            return;
          }

          options.onStreamPhase?.("routing");
          emitStreamPhase(controller, encoder, "routing", options.onStreamPhase);

          const plan = await planRetrieval(
            options.history,
            options.userMessage,
            options.signal,
          );

          if (await cancelled()) {
            await finishAborted(controller, encoder, options.onGenerationEnd);
            return;
          }

          options.onStreamPhase?.("retrieving");
          emitStreamPhase(controller, encoder, "retrieving", options.onStreamPhase);

          const retrieval = await retrieveWithPlan(
            plan,
            options.userMessage,
            options.signal,
            options.shouldStop,
          );

          if (await cancelled()) {
            await finishAborted(controller, encoder, options.onGenerationEnd);
            return;
          }

          emitStreamPhase(controller, encoder, "thinking", options.onStreamPhase);

          const upstream = await createChatCompletionStream({
            messages: buildRagMessages(
              retrieval.chunks,
              options.history,
              options.userMessage,
              retrieval.systemPrompt,
            ),
            signal: options.signal,
          });

          if (await cancelled()) {
            await finishAborted(controller, encoder, options.onGenerationEnd);
            return;
          }

          if (!upstream.ok) {
            let errorMessage = "Upstream request failed";
            try {
              const errorBody = (await upstream.json()) as {
                error?: { message?: string };
              };
              errorMessage = errorBody.error?.message ?? errorMessage;
            } catch {
              // use default
            }

            safeEnqueue(controller, encoder, "error", { message: errorMessage });
            await options.onGenerationEnd?.("error");
            controller.close();
            return;
          }

          pipeOpenRouterToChatStream(controller, upstream.body, {
            emitSaved: false,
            shouldStop: options.shouldStop,
            onThinkingDelta: options.onThinkingDelta,
            onContentDelta: options.onContentDelta,
            onGenerationEnd: options.onGenerationEnd,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            await finishAborted(controller, encoder, options.onGenerationEnd);
            return;
          }

          const message =
            error instanceof Error ? error.message : "Stream failed";
          safeEnqueue(controller, encoder, "error", { message });
          await options.onGenerationEnd?.("error");
          controller.close();
        }
      };

      void run();
    },
  });
}
