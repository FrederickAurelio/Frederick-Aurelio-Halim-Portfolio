import type { ChatStore } from "@/lib/chat-store";
import { getGenerationBufferPollMs } from "@/lib/chat-store/keys";
import type { ChatStreamPhase, GenerationBuffer } from "@/lib/chat/types";
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

function emitPhaseEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  phase: ChatStreamPhase | undefined,
): void {
  if (phase === "routing" || phase === "retrieving") {
    safeEnqueue(controller, encoder, phase, {});
  }
  if (
    phase === "routing" ||
    phase === "retrieving" ||
    phase === "thinking" ||
    phase === "content"
  ) {
    safeEnqueue(controller, encoder, "phase", { phase });
  }
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
  options: {
    sessionId: string;
    store: ChatStore;
    assistantMessageId: string | null;
  },
): Promise<void> {
  emitTrailingBuffer(controller, encoder, buffer, lastReasoningLen, lastContentLen);

  return emitPersistedSuggestions(controller, encoder, options).finally(() => {
    safeEnqueue(controller, encoder, "done", {});
    controller.close();
  });
}

async function emitPersistedSuggestions(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  options: {
    sessionId: string;
    store: ChatStore;
    assistantMessageId: string | null;
  },
): Promise<void> {
  const assistantMessageId = options.assistantMessageId;
  if (!assistantMessageId) return;

  try {
    const { messages } = await options.store.getLatestMessages(
      options.sessionId,
      20,
    );
    const assistant = messages.find(
      (message) =>
        message.id === assistantMessageId && message.role === "assistant",
    );
    if (assistant?.suggestions?.length) {
      safeEnqueue(controller, encoder, "suggestions", {
        items: assistant.suggestions,
      });
    }
  } catch {
    // Subscribe stream should still finish even if suggestion lookup fails.
  }
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
          let assistantMessageId = buffer.assistantMessageId;

          emitPhaseEvent(controller, encoder, buffer.streamPhase);

          while (true) {
            if (signal?.aborted) break;

            const locked = await store.isGenerationLocked(sessionId);
            if (!locked) {
              const finalBuffer = await store.getGenerationBuffer(sessionId);
              if (finalBuffer?.assistantMessageId) {
                assistantMessageId = finalBuffer.assistantMessageId;
              }
              await finishSubscribeStream(
                controller,
                encoder,
                finalBuffer,
                lastReasoningLen,
                lastContentLen,
                { sessionId, store, assistantMessageId },
              );
              return;
            }

            await sleep(pollMs, signal);

            const updated = await store.getGenerationBuffer(sessionId);
            if (!updated) {
              const stillLocked = await store.isGenerationLocked(sessionId);
              if (!stillLocked) {
                await finishSubscribeStream(
                  controller,
                  encoder,
                  null,
                  lastReasoningLen,
                  lastContentLen,
                  { sessionId, store, assistantMessageId },
                );
                return;
              }
              continue;
            }

            assistantMessageId = updated.assistantMessageId;

            if (updated.streamPhase !== lastEmittedPhase) {
              emitPhaseEvent(controller, encoder, updated.streamPhase);
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
