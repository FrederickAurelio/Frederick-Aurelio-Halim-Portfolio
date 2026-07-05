"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/context/TextContext";
import { mergeMessagesById } from "@/lib/chat/merge-messages";
import { isReasoningExpanded } from "@/lib/chat/reasoning-expanded";
import { useChat } from "@/hooks/useChat";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatOpenState } from "@/hooks/useChatOpenState";
import { chat } from "@/utils/data";
import ChatResponsiveShell from "./ChatResponsiveShell";

export default function ChatWidget() {
  const { language } = useLanguage();
  const { open, ready, toggle, close, handleDesktopOpenChange, handleMobileOpenChange } =
    useChatOpenState();

  const {
    storedPages,
    retentionSeconds,
    isLoadingHistory,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages();

  const {
    optimisticMessages,
    isLoading,
    showSuggestions: showSuggestionsIdle,
    sendMessage,
    abort,
  } = useChat({
    notConfigured: chat.chatErrorNotConfigured[language],
    generic: chat.chatErrorGeneric[language],
    generating: chat.chatErrorGenerating[language],
  });

  const [expandedReasoningIds, setExpandedReasoningIds] = useState<Set<string>>(
    () => new Set(),
  );
  const prevStreamingAssistantIdRef = useRef<string | null>(null);

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

  const showSuggestions =
    showSuggestionsIdle &&
    messages.length === 0 &&
    !isLoadingHistory;

  const retentionHours =
    retentionSeconds !== null
      ? Math.max(1, Math.round(retentionSeconds / 3600))
      : null;

  const handleLoadOlder = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  if (!ready) return null;

  return (
    <ChatResponsiveShell
      open={open}
      messages={messages}
      isLoading={isLoading}
      isLoadingHistory={isLoadingHistory}
      showSuggestions={showSuggestions}
      retentionHours={retentionHours}
      retentionLabel={chat.historyRetention[language]}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
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
