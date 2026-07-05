"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/TextContext";
import { chat } from "@/utils/data";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessageList from "./ChatMessageList";
import ChatSuggestions from "./ChatSuggestions";
import type { ChatMessage } from "@/lib/chat/types";

type ChatPanelProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  showSuggestions: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  onAbort: () => void;
  showHandle?: boolean;
  autoFocusInput?: boolean;
};

export default function ChatPanel({
  messages,
  isLoading,
  showSuggestions,
  onClose,
  onSend,
  onAbort,
  showHandle = false,
  autoFocusInput = false,
}: ChatPanelProps) {
  const { language } = useLanguage();

  const title = chat.title[language];
  const closeLabel = chat.closeLabel[language];
  const emptyTitle = chat.emptyTitle[language];
  const emptyDescription = chat.emptyDescription[language];
  const copyLabel = chat.copyLabel[language];
  const copiedLabel = chat.copiedLabel[language];
  const placeholder = chat.placeholder[language];
  const sendLabel = chat.sendLabel[language];
  const stopLabel = chat.stopLabel[language];
  const suggestions = chat.suggestions[language];

  useEffect(() => {
    if (autoFocusInput) {
      const timer = setTimeout(() => {
        const textarea = document.querySelector<HTMLTextAreaElement>(
          "[data-chat-input]",
        );
        textarea?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocusInput]);

  return (
    <div
      role="dialog"
      aria-labelledby="chat-panel-title"
      className="flex h-full min-h-0 flex-col overscroll-y-contain bg-white"
      onWheel={(event) => event.stopPropagation()}
    >
      <ChatHeader
        title={title}
        closeLabel={closeLabel}
        showHandle={showHandle}
        onClose={onClose}
      />

      <ChatMessageList
        messages={messages}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        copyLabel={copyLabel}
        copiedLabel={copiedLabel}
        isLoading={isLoading}
      />

      {showSuggestions && (
        <ChatSuggestions suggestions={suggestions} onSelect={onSend} />
      )}

      <div data-chat-input>
        <ChatInput
          placeholder={placeholder}
          sendLabel={sendLabel}
          stopLabel={stopLabel}
          isLoading={isLoading}
          onSend={onSend}
          onAbort={onAbort}
          autoFocus={autoFocusInput}
        />
      </div>
    </div>
  );
}
