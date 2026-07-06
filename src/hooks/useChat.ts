"use client";

import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { consumeChatStream } from "@/lib/chat/consumeChatStream";
import { createStreamBatcher } from "@/lib/chat/batch-stream-updates";
import {
  appendMessagesToChatCache,
  CHAT_MESSAGES_QUERY_KEY,
  hasStoredGeneratingAssistant,
} from "@/lib/chat/fetch-messages";
import { stopChatGeneration } from "@/lib/chat/stop-generation";
import {
  GENERATION_IN_PROGRESS_CODE,
  NO_ACTIVE_GENERATION_CODE,
  type ChatMessage,
  type ChatStatus,
  type StoredChatMessage,
} from "@/lib/chat/types";
import { CHAT_ERROR_CODES, type ChatErrorCode } from "@/lib/chat/api-errors";
import { resolveChatErrorMessage } from "@/lib/chat/resolve-error-message";
import { SUGGESTION_LIMIT_FOLLOW_UP } from "@/lib/knowledge/pick-suggestions";

type UseChatErrorMessages = {
  notConfigured: string;
  storageUnavailable: string;
  unauthorized: string;
  generic: string;
  generating: string;
};

function formatChatError(
  messages: UseChatErrorMessages,
  options: { code?: ChatErrorCode; message?: string; status?: number },
): string {
  return resolveChatErrorMessage(messages, options);
}

function toStoredMessage(message: ChatMessage): StoredChatMessage | null {
  if (message.role !== "user" && message.role !== "assistant") return null;
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    reasoning: message.reasoning,
    createdAt: message.createdAt,
    suggestions: message.suggestions,
  };
}

function createMessage(
  role: ChatMessage["role"],
  content: string,
  status: ChatMessage["status"] = "complete",
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    status,
    createdAt: Date.now(),
  };
}

function hasPersistableAssistantContent(message: ChatMessage): boolean {
  return (
    Boolean(message.content) ||
    Boolean(message.reasoning) ||
    Boolean(message.suggestions?.length)
  );
}

function finalizeCompletedTurn(
  queryClient: QueryClient,
  setOptimisticMessages: Dispatch<SetStateAction<ChatMessage[]>>,
  pendingSuggestionsRef: MutableRefObject<string[] | null>,
  assistantIds: Set<string>,
  persistIds: Set<string> = assistantIds,
) {
  const suggestions = pendingSuggestionsRef.current?.slice(
    0,
    SUGGESTION_LIMIT_FOLLOW_UP,
  );
  pendingSuggestionsRef.current = null;

  setOptimisticMessages((prev) => {
    const finalized = prev.map((message) =>
      assistantIds.has(message.id)
        ? {
            ...message,
            status: "complete" as const,
            suggestions: suggestions?.length
              ? suggestions
              : message.suggestions,
          }
        : message,
    );

    finalizeOptimisticToCache(queryClient, finalized, persistIds);
    return [];
  });
  // SSE + appendMessagesToChatCache already have this turn (content, reasoning,
  // suggestions, server IDs). Skip invalidateQueries here — it refetches every
  // loaded page (10 msgs each) and races server appendMessage for no gain.
}

function finalizeOptimisticToCache(
  queryClient: QueryClient,
  messages: ChatMessage[],
  ids: Set<string>,
) {
  const stored = messages
    .filter((message) => ids.has(message.id))
    .filter(
      (message) =>
        message.role !== "assistant" || hasPersistableAssistantContent(message),
    )
    .map(toStoredMessage)
    .filter((message): message is StoredChatMessage => message !== null);

  appendMessagesToChatCache(queryClient, stored);
}

export function useChat(errorMessages: UseChatErrorMessages) {
  const queryClient = useQueryClient();
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const resumeInFlightRef = useRef(false);
  const pendingSuggestionsRef = useRef<string[] | null>(null);

  const abort = useCallback(() => {
    pendingSuggestionsRef.current = null;
    setStatus("idle");
    setOptimisticMessages([]);

    void stopChatGeneration().then(() => {
      void queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    });
  }, [queryClient]);

  const resumeGeneration = useCallback(
    async (assistantMessage: ChatMessage) => {
      if (status !== "idle" || resumeInFlightRef.current) return;
      if (assistantMessage.role !== "assistant" || assistantMessage.status !== "streaming") {
        return;
      }

      resumeInFlightRef.current = true;

      let blockedByError = false;
      setOptimisticMessages((prev) => {
        if (prev.some((message) => message.role === "error")) {
          blockedByError = true;
          return prev;
        }

        const streamingAssistant = {
          ...assistantMessage,
          status: "streaming" as const,
        };

        if (prev.some((message) => message.id === assistantMessage.id)) {
          return prev.map((message) =>
            message.id === assistantMessage.id ? streamingAssistant : message,
          );
        }

        return [...prev, streamingAssistant];
      });

      if (blockedByError) {
        resumeInFlightRef.current = false;
        return;
      }

      setStatus("streaming");

      const assistantId = assistantMessage.id;
      let hasReceivedChunk = Boolean(assistantMessage.content || assistantMessage.reasoning);

      const updateAssistant = (
        updater: (message: ChatMessage) => ChatMessage,
      ) => {
        setOptimisticMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId ? updater(message) : message,
          ),
        );
      };

      const streamBatcher = createStreamBatcher(({ reasoning, content }) => {
        updateAssistant((message) => ({
          ...message,
          reasoning: reasoning
            ? (message.reasoning ?? "") + reasoning
            : message.reasoning,
          content: content ? message.content + content : message.content,
        }));
      });

      try {
        await consumeChatStream(
          "/api/chat/generation/stream",
          { method: "GET" },
          {
            onSaved: () => {
              // IDs already known from history
            },
            onSync: ({ content, reasoning, streamPhase }) => {
              updateAssistant((message) => ({
                ...message,
                content,
                reasoning: reasoning || undefined,
                streamPhase: streamPhase ?? message.streamPhase,
              }));
            },
            onRouting: () => {
              updateAssistant((message) => ({
                ...message,
                streamPhase: "routing",
              }));
            },
            onRetrieving: () => {
              updateAssistant((message) => ({
                ...message,
                streamPhase: "retrieving",
              }));
            },
            onPhase: (phase) => {
              updateAssistant((message) => ({
                ...message,
                streamPhase: phase,
              }));
            },
            onThinking: (delta) => {
              if (!hasReceivedChunk) {
                hasReceivedChunk = true;
                setStatus("streaming");
              }
              streamBatcher.pushThinking(delta);
              updateAssistant((message) => ({
                ...message,
                streamPhase: message.content ? "content" : "thinking",
              }));
            },
            onContent: (delta) => {
              if (!hasReceivedChunk) {
                hasReceivedChunk = true;
                setStatus("streaming");
              }
              streamBatcher.pushContent(delta);
              updateAssistant((message) => ({
                ...message,
                streamPhase: "content",
              }));
            },
            onSuggestions: (items) => {
              pendingSuggestionsRef.current = items.slice(
                0,
                SUGGESTION_LIMIT_FOLLOW_UP,
              );
            },
            onDone: () => {
              streamBatcher.flushNow();
              finalizeCompletedTurn(
                queryClient,
                setOptimisticMessages,
                pendingSuggestionsRef,
                new Set([assistantId]),
              );
            },
            onError: (message, httpStatus, code) => {
              streamBatcher.flushNow();

              if (httpStatus === 404 || message === NO_ACTIVE_GENERATION_CODE) {
                pendingSuggestionsRef.current = null;
                setOptimisticMessages([]);
                void queryClient.invalidateQueries({
                  queryKey: CHAT_MESSAGES_QUERY_KEY,
                });
                return;
              }

              const errorText = formatChatError(errorMessages, {
                code,
                message,
                status: httpStatus,
              });

              let shouldFinalize = false;
              setOptimisticMessages((prev) => {
                const assistant = prev.find((m) => m.id === assistantId);
                const hasPartial =
                  Boolean(assistant?.content) ||
                  Boolean(assistant?.reasoning) ||
                  Boolean(pendingSuggestionsRef.current?.length);

                if (assistant && hasPartial) {
                  shouldFinalize = true;
                  return prev;
                }

                return prev.map((messageState) =>
                  messageState.id === assistantId
                    ? {
                        ...messageState,
                        role: "error" as const,
                        content: errorText,
                        status: "error" as const,
                      }
                    : messageState,
                );
              });

              if (shouldFinalize) {
                finalizeCompletedTurn(
                  queryClient,
                  setOptimisticMessages,
                  pendingSuggestionsRef,
                  new Set([assistantId]),
                );
              }
            },
          },
        );
      } catch {
        streamBatcher.flushNow();
        updateAssistant((message) => ({
          ...message,
          role: "error" as const,
          content: errorMessages.generic,
          status: "error" as const,
        }));
      } finally {
        resumeInFlightRef.current = false;
        setStatus("idle");
      }
    },
    [status, errorMessages, queryClient],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status !== "idle") return;

      if (hasStoredGeneratingAssistant(queryClient)) {
        setOptimisticMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "error" as const,
            content: errorMessages.generating,
            status: "error" as const,
            createdAt: Date.now(),
          },
        ]);
        return;
      }

      const tempUserId = crypto.randomUUID();
      const tempAssistantId = crypto.randomUUID();

      const userMessage: ChatMessage = {
        ...createMessage("user", trimmed),
        id: tempUserId,
      };
      const assistantPlaceholder: ChatMessage = {
        id: tempAssistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        createdAt: Date.now(),
      };

      setOptimisticMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setStatus("submitting");
      pendingSuggestionsRef.current = null;

      let hasReceivedChunk = false;
      let serverUserId = tempUserId;
      let serverAssistantId = tempAssistantId;

      const updateAssistant = (
        updater: (message: ChatMessage) => ChatMessage,
      ) => {
        setOptimisticMessages((prev) =>
          prev.map((message) =>
            message.id === serverAssistantId ||
            message.id === tempAssistantId
              ? updater(message)
              : message,
          ),
        );
      };

      const streamBatcher = createStreamBatcher(({ reasoning, content }) => {
        updateAssistant((message) => ({
          ...message,
          reasoning: reasoning
            ? (message.reasoning ?? "") + reasoning
            : message.reasoning,
          content: content ? message.content + content : message.content,
        }));
      });

      const reconcileIds = (userMessageId: string, assistantMessageId: string) => {
        serverUserId = userMessageId;
        serverAssistantId = assistantMessageId;
        setOptimisticMessages((prev) =>
          prev.map((message) => {
            if (message.id === tempUserId) {
              return { ...message, id: userMessageId };
            }
            if (message.id === tempAssistantId) {
              return { ...message, id: assistantMessageId };
            }
            return message;
          }),
        );
      };

      const finalizeSendTurn = () => {
        finalizeCompletedTurn(
          queryClient,
          setOptimisticMessages,
          pendingSuggestionsRef,
          new Set([serverAssistantId]),
          new Set([serverUserId, serverAssistantId]),
        );
      };

      try {
        await consumeChatStream(
          "/api/chat",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: trimmed }),
          },
          {
            onSaved: ({ userMessageId, assistantMessageId }) => {
              reconcileIds(userMessageId, assistantMessageId);
            },
            onRouting: () => {
              updateAssistant((message) => ({
                ...message,
                streamPhase: "routing",
              }));
            },
            onRetrieving: () => {
              updateAssistant((message) => ({
                ...message,
                streamPhase: "retrieving",
              }));
            },
            onPhase: (phase) => {
              updateAssistant((message) => ({
                ...message,
                streamPhase: phase,
              }));
            },
            onThinking: (delta) => {
              if (!hasReceivedChunk) {
                hasReceivedChunk = true;
                setStatus("streaming");
              }

              streamBatcher.pushThinking(delta);
              updateAssistant((message) => ({
                ...message,
                streamPhase: message.content ? "content" : "thinking",
              }));
            },
            onContent: (delta) => {
              if (!hasReceivedChunk) {
                hasReceivedChunk = true;
                setStatus("streaming");
              }

              streamBatcher.pushContent(delta);
              updateAssistant((message) => ({
                ...message,
                streamPhase: "content",
              }));
            },
            onSuggestions: (items) => {
              pendingSuggestionsRef.current = items.slice(
                0,
                SUGGESTION_LIMIT_FOLLOW_UP,
              );
            },
            onDone: () => {
              streamBatcher.flushNow();
              finalizeSendTurn();
            },
            onError: (message, httpStatus, code) => {
              streamBatcher.flushNow();
              const isGenerating =
                httpStatus === 409 ||
                code === CHAT_ERROR_CODES.GENERATION_IN_PROGRESS ||
                message === GENERATION_IN_PROGRESS_CODE;

              if (isGenerating) {
                pendingSuggestionsRef.current = null;
                setOptimisticMessages((prev) => {
                  const withoutPair = prev.filter(
                    (item) =>
                      item.id !== tempUserId &&
                      item.id !== tempAssistantId &&
                      item.id !== serverUserId &&
                      item.id !== serverAssistantId,
                  );

                  return [
                    ...withoutPair,
                    {
                      id: crypto.randomUUID(),
                      role: "error" as const,
                      content: errorMessages.generating,
                      status: "error" as const,
                      createdAt: Date.now(),
                    },
                  ];
                });
                return;
              }

              const errorText = formatChatError(errorMessages, {
                code,
                message,
                status: httpStatus,
              });

              let shouldFinalize = false;
              setOptimisticMessages((prev) => {
                const assistant = prev.find((m) => m.id === serverAssistantId);
                const hasPartial =
                  Boolean(assistant?.content) ||
                  Boolean(assistant?.reasoning) ||
                  Boolean(pendingSuggestionsRef.current?.length);

                if (assistant && hasPartial) {
                  shouldFinalize = true;
                  return prev;
                }

                return prev.map((messageState) => {
                  if (
                    messageState.id !== serverAssistantId &&
                    messageState.id !== tempAssistantId
                  ) {
                    return messageState;
                  }

                  return {
                    ...messageState,
                    role: "error" as const,
                    content: errorText,
                    status: "error" as const,
                  };
                });
              });

              if (shouldFinalize) {
                finalizeSendTurn();
              }
            },
          },
        );
      } catch {
        streamBatcher.flushNow();
        updateAssistant((message) => ({
          ...message,
          role: "error" as const,
          content: errorMessages.generic,
          status: "error" as const,
        }));
      } finally {
        setStatus("idle");
      }
    },
    [status, errorMessages, queryClient],
  );

  const isLoading = status === "submitting" || status === "streaming";

  return {
    optimisticMessages,
    status,
    isLoading,
    sendMessage,
    resumeGeneration,
    abort,
  };
}
