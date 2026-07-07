"use client";

import { useLanguage } from "@/context/TextContext";
import { chat } from "@/utils/data";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessageList from "./ChatMessageList";
import ChatRetentionNotice from "./ChatRetentionNotice";
import ChatSuggestions from "./ChatSuggestions";
import type { ChatMessage } from "@/lib/chat/types";

type ChatPanelProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  showSuggestions: boolean;
  suggestions: string[];
  retentionHours: number | null;
  retentionLabel: string;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  historyErrorTitle?: string;
  historyErrorDescription?: string;
  retryLabel?: string;
  onRetryHistory?: () => void;
  inputDisabled?: boolean;
  inputDisabledPlaceholder?: string;
  onLoadOlder: () => void;
  onClose: () => void;
  onSend: (text: string) => void;
  onAbort: () => void;
  onToggleReasoning: (messageId: string) => void;
  showHandle?: boolean;
  autoFocusInput?: boolean;
};

export default function ChatPanel({
  messages,
  isLoading,
  isLoadingHistory,
  showSuggestions,
  suggestions,
  retentionHours,
  retentionLabel,
  hasNextPage,
  isFetchingNextPage,
  historyErrorTitle,
  historyErrorDescription,
  retryLabel,
  onRetryHistory,
  inputDisabled = false,
  inputDisabledPlaceholder,
  onLoadOlder,
  onClose,
  onSend,
  onAbort,
  onToggleReasoning,
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
  const thinkingLabel = chat.thinkingLabel[language];
  const thinkingDoneLabel = chat.thinkingDoneLabel[language];
  const retrievingLabel = chat.retrievingLabel[language];
  const routingLabel = chat.routingLabel[language];
  const showThinkingLabel = chat.showThinkingLabel[language];
  const hideThinkingLabel = chat.hideThinkingLabel[language];

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
        thinkingLabel={thinkingLabel}
        thinkingDoneLabel={thinkingDoneLabel}
        retrievingLabel={retrievingLabel}
        routingLabel={routingLabel}
        showThinkingLabel={showThinkingLabel}
        hideThinkingLabel={hideThinkingLabel}
        isLoading={isLoading}
        isLoadingHistory={isLoadingHistory}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        historyErrorTitle={historyErrorTitle}
        historyErrorDescription={historyErrorDescription}
        retryLabel={retryLabel}
        onRetryHistory={onRetryHistory}
        onLoadOlder={onLoadOlder}
        onToggleReasoning={onToggleReasoning}
      />

      {showSuggestions && (
        <ChatSuggestions suggestions={suggestions} onSelect={onSend} />
      )}

      <div data-chat-input>
        <ChatInput
          placeholder={inputDisabled && inputDisabledPlaceholder ? inputDisabledPlaceholder : placeholder}
          sendLabel={sendLabel}
          stopLabel={stopLabel}
          isLoading={isLoading}
          disabled={inputDisabled}
          onSend={onSend}
          onAbort={onAbort}
          autoFocus={autoFocusInput}
        />
      </div>

      {retentionHours !== null && (
        <ChatRetentionNotice hours={retentionHours} labelTemplate={retentionLabel} />
      )}
    </div>
  );
}
