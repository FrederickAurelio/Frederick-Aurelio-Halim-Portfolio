import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { ChatStreamCallbacks } from "@/lib/chat/consumeChatStream";
import type { createStreamBatcher } from "@/lib/chat/batch-stream-updates";
import type { ChatErrorCode } from "@/lib/chat/api-errors";
import type { ChatMessage, ChatStatus } from "@/lib/chat/types";
import { SUGGESTION_LIMIT_FOLLOW_UP } from "@/lib/knowledge/pick-suggestions";
import { resolveChatErrorMessage } from "@/lib/chat/resolve-error-message";

export type StreamBatcher = ReturnType<typeof createStreamBatcher>;

type ErrorMessages = {
  notConfigured: string;
  storageUnavailable: string;
  unauthorized: string;
  generic: string;
  generating: string;
  vercelTimeout: string;
};

export type CreateAssistantStreamCallbacksOptions = {
  updateAssistant: (updater: (message: ChatMessage) => ChatMessage) => void;
  setOptimisticMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  streamBatcher: StreamBatcher;
  pendingSuggestionsRef: MutableRefObject<string[] | null>;
  hasReceivedChunk: { current: boolean };
  setStatus: Dispatch<SetStateAction<ChatStatus>>;
  onFinalize: () => void;
  errorMessages: ErrorMessages;
  isTargetAssistant: (message: ChatMessage) => boolean;
  onErrorEarly?: (
    message: string,
    httpStatus?: number,
    code?: ChatErrorCode,
  ) => boolean;
  onSaved?: ChatStreamCallbacks["onSaved"];
  onSync?: ChatStreamCallbacks["onSync"];
};

function formatChatError(
  messages: ErrorMessages,
  options: { code?: ChatErrorCode; message?: string; status?: number },
): string {
  return resolveChatErrorMessage(messages, options);
}

export function createAssistantStreamCallbacks(
  options: CreateAssistantStreamCallbacksOptions,
): ChatStreamCallbacks {
  const {
    updateAssistant,
    setOptimisticMessages,
    streamBatcher,
    pendingSuggestionsRef,
    hasReceivedChunk,
    setStatus,
    onFinalize,
    errorMessages,
    isTargetAssistant,
    onErrorEarly,
    onSaved,
    onSync,
  } = options;

  const markStreamingIfNeeded = () => {
    if (!hasReceivedChunk.current) {
      hasReceivedChunk.current = true;
      setStatus("streaming");
    }
  };

  return {
    onSaved,
    onSync,
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
      markStreamingIfNeeded();
      streamBatcher.pushThinking(delta);
      updateAssistant((message) => ({
        ...message,
        streamPhase: message.content ? "content" : "thinking",
      }));
    },
    onContent: (delta) => {
      markStreamingIfNeeded();
      streamBatcher.pushContent(delta);
      updateAssistant((message) => ({
        ...message,
        streamPhase: "content",
      }));
    },
    onSuggestions: (items) => {
      pendingSuggestionsRef.current = items.slice(0, SUGGESTION_LIMIT_FOLLOW_UP);
    },
    onDone: () => {
      streamBatcher.flushNow();
      onFinalize();
    },
    onError: (message, httpStatus, code) => {
      streamBatcher.flushNow();

      if (onErrorEarly?.(message, httpStatus, code)) {
        return;
      }

      const errorText = formatChatError(errorMessages, {
        code,
        message,
        status: httpStatus,
      });

      let shouldFinalize = false;
      setOptimisticMessages((prev) => {
        const assistant = prev.find(
          (entry) =>
            entry.role === "assistant" && isTargetAssistant(entry),
        );
        const hasPartial =
          Boolean(assistant?.content) ||
          Boolean(assistant?.reasoning) ||
          Boolean(pendingSuggestionsRef.current?.length);

        if (assistant && hasPartial) {
          shouldFinalize = true;
          return prev;
        }

        return prev.map((messageState) =>
          isTargetAssistant(messageState)
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
        onFinalize();
      }
    },
  };
}
