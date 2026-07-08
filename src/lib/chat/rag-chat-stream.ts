import { SuggestionTrailerFilter } from "@/lib/chat/suggestion-trailer";
import { planRetrievalForTurn } from "@/lib/knowledge/plan-retrieval";
import type { SessionRoutingState } from "@/lib/knowledge/session-routing-state";
import { buildRagMessages } from "@/lib/knowledge/build-messages";
import {
  pickSuggestions,
  SUGGESTION_LIMIT_FOLLOW_UP,
} from "@/lib/knowledge/pick-suggestions";
import { detectReplyLanguage } from "@/lib/knowledge/refusal";
import { retrieveWithPlan } from "@/lib/knowledge/retrieve";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";
import {
  isVercelFunctionTimeoutSignal,
  VERCEL_FUNCTION_TIMEOUT_CODE,
} from "@/lib/chat/vercel-runtime";
import { createChatCompletionStream } from "@/lib/openrouter/client";
import { REQUEST_TIMEOUT_MESSAGE } from "@/lib/openrouter/fetch-with-timeout";
import {
  emitChatPhase,
  emitContentDelta,
  emitDone,
  emitSuggestions,
  emitThinkingDelta,
  safeEnqueue,
} from "@/lib/chat/sse";
import {
  pipeOpenRouterToChatStream,
  type GenerationEndReason,
  type StreamTransformHooks,
} from "@/lib/openrouter/stream-transform";
import type { ChatStreamPhase } from "@/lib/chat/types";
import type { OpenRouterMessage } from "@/lib/openrouter/types";

export type RagChatStreamOptions = StreamTransformHooks & {
  savedPayload: { userMessageId: string; assistantMessageId: string };
  history: OpenRouterMessage[];
  userMessage: string;
  routingState: SessionRoutingState;
  previousSuggestions?: string[];
  signal?: AbortSignal;
  shouldStop?: () => boolean | Promise<boolean>;
  onStreamPhase?: (phase: ChatStreamPhase) => void;
  onRoutingStateReady?: (state: SessionRoutingState) => void | Promise<void>;
  onGenerationEnd?: (
    reason: GenerationEndReason,
  ) => void | Promise<void | Record<string, unknown>>;
  onSuggestionsReady?: (items: string[]) => void;
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

async function finishWithError(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  message: string,
  onGenerationEnd?: (
    reason: GenerationEndReason,
  ) => void | Promise<void | Record<string, unknown>>,
  code?: string,
): Promise<void> {
  safeEnqueue(controller, encoder, "error", { message, code });
  await onGenerationEnd?.("error");
  controller.close();
}

async function finishIfCancelled(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  signal: AbortSignal | undefined,
  cancelled: () => Promise<boolean>,
  onGenerationEnd?: (
    reason: GenerationEndReason,
  ) => void | Promise<void | Record<string, unknown>>,
): Promise<boolean> {
  if (!(await cancelled())) return false;

  if (isVercelFunctionTimeoutSignal(signal)) {
    await finishWithError(
      controller,
      encoder,
      VERCEL_FUNCTION_TIMEOUT_CODE,
      onGenerationEnd,
      CHAT_ERROR_CODES.VERCEL_TIMEOUT,
    );
    return true;
  }

  await finishAborted(controller, encoder, onGenerationEnd);
  return true;
}

function isUserAbort(userSignal?: AbortSignal): boolean {
  if (!userSignal?.aborted) return false;
  if (isVercelFunctionTimeoutSignal(userSignal)) return false;
  return true;
}

function toStreamErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === REQUEST_TIMEOUT_MESSAGE) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Stream failed";
}

async function finishAborted(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  onGenerationEnd?: (
    reason: GenerationEndReason,
  ) => void | Promise<void | Record<string, unknown>>,
): Promise<void> {
  const extra = await onGenerationEnd?.("aborted");
  const donePayload =
    extra && typeof extra === "object" ? extra : {};
  emitDone(controller, encoder, donePayload);
  controller.close();
}

function appendVisibleTail(
  tail: string,
  assistantAnswer: string,
  options: RagChatStreamOptions,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
): string {
  if (!tail) return assistantAnswer;
  options.onContentDelta?.(tail);
  emitContentDelta(controller, encoder, tail);
  return assistantAnswer + tail;
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

          if (
            await finishIfCancelled(
              controller,
              encoder,
              options.signal,
              cancelled,
              options.onGenerationEnd,
            )
          ) {
            return;
          }

          options.onStreamPhase?.("routing");
          emitChatPhase(controller, encoder, "routing", {
            onPhase: options.onStreamPhase,
          });

          const { plan, nextRoutingState } = await planRetrievalForTurn(
            options.history,
            options.userMessage,
            options.routingState,
            options.signal,
          );

          await options.onRoutingStateReady?.(nextRoutingState);

          if (
            await finishIfCancelled(
              controller,
              encoder,
              options.signal,
              cancelled,
              options.onGenerationEnd,
            )
          ) {
            return;
          }

          options.onStreamPhase?.("retrieving");
          emitChatPhase(controller, encoder, "retrieving", {
            onPhase: options.onStreamPhase,
          });

          const retrieval = await retrieveWithPlan(
            plan,
            options.userMessage,
            options.signal,
            options.shouldStop,
          );

          if (
            await finishIfCancelled(
              controller,
              encoder,
              options.signal,
              cancelled,
              options.onGenerationEnd,
            )
          ) {
            return;
          }

          const language = detectReplyLanguage(options.userMessage);
          const userMessages = [
            ...options.history
              .filter((m) => m.role === "user")
              .map((m) => m.content),
            options.userMessage,
          ];
          let assistantAnswer = "";
          const trailerFilter = new SuggestionTrailerFilter();

          emitChatPhase(controller, encoder, "thinking", {
            onPhase: options.onStreamPhase,
          });

          const upstream = await createChatCompletionStream({
            messages: buildRagMessages(
              retrieval.chunks,
              options.history,
              options.userMessage,
              retrieval.systemPrompt,
            ),
            signal: options.signal,
          });

          if (
            await finishIfCancelled(
              controller,
              encoder,
              options.signal,
              cancelled,
              options.onGenerationEnd,
            )
          ) {
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

            await finishWithError(
              controller,
              encoder,
              errorMessage,
              options.onGenerationEnd,
            );
            return;
          }

          pipeOpenRouterToChatStream(controller, upstream.body, {
            emitSaved: false,
            signal: options.signal,
            shouldStop: options.shouldStop,
            contentFilter: (delta) => trailerFilter.push(delta),
            onThinkingDelta: options.onThinkingDelta,
            onContentDelta: (delta) => {
              assistantAnswer += delta;
              options.onContentDelta?.(delta);
            },
            onGenerationEnd: async (reason) => {
              const shouldFinalizeTrailer =
                reason === "complete" ||
                reason === "aborted" ||
                (reason === "error" && assistantAnswer.length > 0);

              if (shouldFinalizeTrailer) {
                const trailerResult = trailerFilter.finalize();
                assistantAnswer = appendVisibleTail(
                  trailerResult.flushedTail,
                  assistantAnswer,
                  options,
                  controller,
                  encoder,
                );

                if (reason === "complete" && assistantAnswer.trim()) {
                  let suggestionItems: string[] = [];
                  const retrievedChunkIds = retrieval.chunks.map((chunk) => chunk.id);

                  if (retrieval.plan.intent === "off_topic") {
                    suggestionItems = pickSuggestions({
                      mode: "off_topic",
                      language,
                      userMessages,
                      previousSuggestions: options.previousSuggestions,
                      max: SUGGESTION_LIMIT_FOLLOW_UP,
                    });
                  } else if (
                    trailerResult.markerFound &&
                    !trailerResult.parseFailed
                  ) {
                    suggestionItems = (trailerResult.suggestions ?? []).slice(
                      0,
                      SUGGESTION_LIMIT_FOLLOW_UP,
                    );
                  } else {
                    suggestionItems = pickSuggestions({
                      mode: "fallback",
                      language,
                      plan: retrieval.plan,
                      userMessages,
                      previousSuggestions: options.previousSuggestions,
                      assistantAnswer,
                      retrievedChunkIds,
                      max: SUGGESTION_LIMIT_FOLLOW_UP,
                    });
                  }

                  options.onSuggestionsReady?.(suggestionItems);
                  emitSuggestions(controller, encoder, suggestionItems);
                }
              }

              return options.onGenerationEnd?.(reason);
            },
          });
        } catch (error) {
          if (isVercelFunctionTimeoutSignal(options.signal)) {
            await finishWithError(
              controller,
              encoder,
              VERCEL_FUNCTION_TIMEOUT_CODE,
              options.onGenerationEnd,
              CHAT_ERROR_CODES.VERCEL_TIMEOUT,
            );
            return;
          }

          if (isUserAbort(options.signal)) {
            await finishAborted(controller, encoder, options.onGenerationEnd);
            return;
          }

          await finishWithError(
            controller,
            encoder,
            toStreamErrorMessage(error),
            options.onGenerationEnd,
          );
        }
      };

      void run();
    },
  });
}
