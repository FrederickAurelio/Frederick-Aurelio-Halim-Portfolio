"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/TextContext";
import { resolveChatErrorMessage } from "@/lib/chat/resolve-error-message";
import { mergeMessagesById } from "@/lib/chat/merge-messages";
import { isReasoningExpanded } from "@/lib/chat/reasoning-expanded";
import { resolveDisplaySuggestions } from "@/lib/knowledge/resolve-display-suggestions";
import { useChat } from "@/hooks/useChat";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatOpenState } from "@/hooks/useChatOpenState";
import { chat } from "@/utils/data";
import ChatResponsiveShell from "./ChatResponsiveShell";

export default function ChatWidget() {
  const { language } = useLanguage();
  const { open, ready, toggle, close, handleDesktopOpenChange, handleMobileOpenChange } =
    useChatOpenState();

  const errorMessages = useMemo(
    () => ({
      notConfigured: chat.chatErrorNotConfigured[language],
      storageUnavailable: chat.chatErrorStorage[language],
      unauthorized: chat.chatErrorUnauthorized[language],
      generic: chat.chatErrorGeneric[language],
      generating: chat.chatErrorGenerating[language],
      vercelTimeout: chat.chatErrorVercelTimeout[language],
    }),
    [language],
  );

  const {
    storedPages,
    retentionSeconds,
    isLoadingHistory,
    isRefetchingHistory,
    isHistoryError,
    historyError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetchHistory,
  } = useChatMessages();

  const {
    optimisticMessages,
    isLoading,
    sendMessage,
    resumeGeneration,
    abort,
  } = useChat(errorMessages);

  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Set<string>>(
    () => new Set(),
  );
  const prevStreamingAssistantIdRef = useRef<string | null>(null);
  const resumeStartedRef = useRef(false);

  const historyErrorDescription = useMemo(() => {
    if (!isHistoryError) return undefined;
    if (!historyError) return errorMessages.generic;
    return resolveChatErrorMessage(errorMessages, {
      code: historyError.code,
      message: historyError.message,
      status: historyError.status,
    });
  }, [isHistoryError, historyError, errorMessages]);

  const isChatUnavailable = isHistoryError;

  const toggleReasoningExpanded = useCallback((messageId: string) => {
    setExpandedReasoningIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  useEffect(() => {
    const assistant = optimisticMessages.find(
      (message) => message.role === "assistant" && message.status === "streaming",
    );
    const currentId = assistant?.id ?? null;
    const prevId = prevStreamingAssistantIdRef.current;

    if (prevId && currentId && prevId !== currentId) {
      setExpandedReasoningIds((prev) => {
        if (!prev.has(prevId)) return prev;
        const next = new Set(prev);
        next.delete(prevId);
        next.add(currentId);
        return next;
      });
    }

    prevStreamingAssistantIdRef.current = currentId;
  }, [optimisticMessages]);

  const messages = useMemo(() => {
    const merged = mergeMessagesById(storedPages, optimisticMessages);
    return merged.map((message) => ({
      ...message,
      reasoningExpanded: isReasoningExpanded(message, expandedReasoningIds),
    }));
  }, [storedPages, optimisticMessages, expandedReasoningIds]);

  useEffect(() => {
    if (isLoadingHistory || isLoading) return;

    const generating = messages.find(
      (message) => message.role === "assistant" && message.status === "streaming",
    );

    if (!generating) {
      resumeStartedRef.current = false;
      return;
    }

    if (resumeStartedRef.current) return;

    const hasError = optimisticMessages.some((message) => message.role === "error");
    if (hasError) return;

    resumeStartedRef.current = true;
    void resumeGeneration(generating);
  }, [
    isLoadingHistory,
    isLoading,
    messages,
    optimisticMessages,
    resumeGeneration,
  ]);

  const suggestions = useMemo(
    () => resolveDisplaySuggestions(messages, isLoading),
    [messages, isLoading],
  );

  const lastMessage = messages.at(-1);
  const showSuggestions =
    !isLoading &&
    !isLoadingHistory &&
    !isHistoryError &&
    optimisticMessages.length === 0 &&
    (messages.length === 0 || lastMessage?.role === "assistant") &&
    suggestions.length > 0;

  const retentionHours =
    retentionSeconds !== null
      ? Math.max(1, Math.round(retentionSeconds / 3600))
      : null;

  const handleLoadOlder = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  const handleRetryHistory = useCallback(() => {
    void refetchHistory();
  }, [refetchHistory]);

  if (!ready) return null;

  return (
    <ChatResponsiveShell
      open={open}
      messages={messages}
      isLoading={isLoading}
      isLoadingHistory={isLoadingHistory || isRefetchingHistory}
      showSuggestions={showSuggestions}
      suggestions={suggestions}
      retentionHours={retentionHours}
      retentionLabel={chat.historyRetention[language]}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      historyErrorTitle={isHistoryError ? chat.chatErrorLoadHistory[language] : undefined}
      historyErrorDescription={historyErrorDescription}
      retryLabel={chat.chatRetryLabel[language]}
      onRetryHistory={isHistoryError ? handleRetryHistory : undefined}
      inputDisabled={isChatUnavailable}
      inputDisabledPlaceholder={chat.chatInputUnavailable[language]}
      onLoadOlder={handleLoadOlder}
      onDesktopOpenChange={handleDesktopOpenChange}
      onMobileOpenChange={handleMobileOpenChange}
      onClose={close}
      onToggle={toggle}
      onSend={sendMessage}
      onAbort={abort}
      onToggleReasoning={toggleReasoningExpanded}
    />
  );
}
