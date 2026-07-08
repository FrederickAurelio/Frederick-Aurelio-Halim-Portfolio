import type { ChatStore } from "@/lib/chat-store";
import { getGenerationBufferPollMs } from "@/lib/chat-store/keys";
import {
  CHAT_SSE_HEADERS,
  emitChatPhase,
  emitContentDelta,
  emitDone,
  emitSuggestions,
  emitThinkingDelta,
  safeEnqueue,
} from "@/lib/chat/sse";
import type { GenerationBuffer } from "@/lib/chat/types";

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

  emitThinkingDelta(controller, encoder, thinkingDelta);
  emitContentDelta(controller, encoder, contentDelta);

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

  if (buffer?.suggestions?.length) {
    emitSuggestions(controller, encoder, buffer.suggestions);
  }

  emitDone(controller, encoder);
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
            streamPhase: buffer.streamPhase,
          });

          let lastSeq = buffer.seq;
          let lastReasoningLen = buffer.reasoning.length;
          let lastContentLen = buffer.content.length;
          let lastEmittedPhase = buffer.streamPhase;

          emitChatPhase(controller, encoder, buffer.streamPhase);

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

            if (updated.streamPhase !== lastEmittedPhase) {
              emitChatPhase(controller, encoder, updated.streamPhase);
              lastEmittedPhase = updated.streamPhase;
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
              if (updated.streamPhase === "thinking" || updated.streamPhase === "content") {
                lastEmittedPhase = updated.streamPhase;
              }
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
