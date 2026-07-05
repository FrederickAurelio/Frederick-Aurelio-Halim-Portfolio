"use client";

import { useCallback, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { consumeChatStream } from "@/lib/chat/consumeChatStream";
import { createStreamBatcher } from "@/lib/chat/batch-stream-updates";
import { appendMessagesToChatCache, CHAT_MESSAGES_QUERY_KEY } from "@/lib/chat/fetch-messages";
import { stopChatGeneration } from "@/lib/chat/stop-generation";
import {
  GENERATION_IN_PROGRESS_CODE,
  type ChatMessage,
  type ChatStatus,
  type StoredChatMessage,
} from "@/lib/chat/types";

function toStoredMessage(message: ChatMessage): StoredChatMessage | null {
  if (message.role !== "user" && message.role !== "assistant") return null;
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    reasoning: message.reasoning,
    createdAt: message.createdAt,
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
  return Boolean(message.content) || Boolean(message.reasoning);
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

export function useChat(errorMessages: {
  notConfigured: string;
  generic: string;
  generating: string;
}) {
  const queryClient = useQueryClient();
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");

  const showSuggestions = optimisticMessages.length === 0 && status === "idle";

  const abort = useCallback(() => {
    setStatus("idle");
    setOptimisticMessages([]);

    void stopChatGeneration().then(() => {
      void queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_QUERY_KEY });
    });
  }, [queryClient]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status !== "idle") return;

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
            onThinking: (delta) => {
              if (!hasReceivedChunk) {
                hasReceivedChunk = true;
                setStatus("streaming");
              }

              streamBatcher.pushThinking(delta);
            },
            onContent: (delta) => {
              if (!hasReceivedChunk) {
                hasReceivedChunk = true;
                setStatus("streaming");
              }

              streamBatcher.pushContent(delta);
            },
            onDone: () => {
              streamBatcher.flushNow();
              setOptimisticMessages((prev) => {
                const finalized = prev.map((message) =>
                  message.id === serverAssistantId ||
                  message.id === tempAssistantId
                    ? {
                        ...message,
                        status: "complete" as const,
                      }
                    : message,
                );

                finalizeOptimisticToCache(
                  queryClient,
                  finalized,
                  new Set([
                    serverUserId,
                    serverAssistantId,
                    tempUserId,
                    tempAssistantId,
                  ]),
                );
                return [];
              });
            },
            onError: (message, httpStatus) => {
              streamBatcher.flushNow();
              const isGenerating =
                httpStatus === 409 || message === GENERATION_IN_PROGRESS_CODE;

              if (isGenerating) {
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

              const isNotConfigured = message
                .toLowerCase()
                .includes("not configured");

              updateAssistant((messageState) => {
                const hasPartial =
                  Boolean(messageState.content) || Boolean(messageState.reasoning);

                if (hasPartial) {
                  return {
                    ...messageState,
                    status: "complete" as const,
                  };
                }

                return {
                  ...messageState,
                  role: "error" as const,
                  content: isNotConfigured
                    ? errorMessages.notConfigured
                    : errorMessages.generic,
                  status: "error" as const,
                };
              });
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
    showSuggestions,
    sendMessage,
    abort,
  };
}
