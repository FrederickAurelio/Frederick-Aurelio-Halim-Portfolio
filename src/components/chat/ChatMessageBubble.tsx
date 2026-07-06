"use client";

import { useState } from "react";
import { HiOutlineClipboard, HiOutlineClipboardDocumentCheck } from "react-icons/hi2";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import ChatMarkdown from "./chat-markdown";
import ChatReasoningBlock from "./ChatReasoningBlock";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  copyLabel: string;
  copiedLabel: string;
  thinkingLabel: string;
  thinkingDoneLabel: string;
  retrievingLabel: string;
  routingLabel: string;
  showThinkingLabel: string;
  hideThinkingLabel: string;
  onToggleReasoning?: (messageId: string) => void;
};

export default function ChatMessageBubble({
  message,
  copyLabel,
  copiedLabel,
  thinkingLabel,
  thinkingDoneLabel,
  retrievingLabel,
  routingLabel,
  showThinkingLabel,
  hideThinkingLabel,
  onToggleReasoning,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.role === "error";
  const isStreaming = message.status === "streaming";
  const isRouting =
    isStreaming &&
    message.streamPhase === "routing" &&
    !message.content &&
    !message.reasoning;
  const isRetrieving =
    isStreaming &&
    message.streamPhase === "retrieving" &&
    !message.content &&
    !message.reasoning;
  const isThinking =
    isStreaming &&
    message.streamPhase === "thinking" &&
    !message.content &&
    !message.reasoning;
  const showTypingDots =
    isStreaming &&
    !message.content &&
    !message.reasoning &&
    !isRouting &&
    !isRetrieving &&
    !isThinking;

  const handleCopy = async () => {
    if (!message.content) return;
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser && "bg-sky-500 text-white",
          !isUser && !isError && "bg-slate-100 text-slate-900",
          isError && "bg-red-50 text-red-700",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : isRouting ? (
          <PhaseIndicator label={routingLabel} />
        ) : isRetrieving ? (
          <PhaseIndicator label={retrievingLabel} />
        ) : isThinking ? (
          <PhaseIndicator label={thinkingLabel} />
        ) : isError ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : showTypingDots ? (
          <TypingDots />
        ) : (
          <>
            {message.reasoning && onToggleReasoning && (
              <ChatReasoningBlock
                reasoning={message.reasoning}
                isStreaming={isStreaming}
                hasContent={Boolean(message.content)}
                expanded={message.reasoningExpanded ?? false}
                thinkingLabel={thinkingLabel}
                thinkingDoneLabel={thinkingDoneLabel}
                showThinkingLabel={showThinkingLabel}
                hideThinkingLabel={hideThinkingLabel}
                onToggle={() => onToggleReasoning(message.id)}
              />
            )}

            {message.content && <ChatMarkdown content={message.content} />}

            {isStreaming && message.reasoning && !message.content && (
              <span className="sr-only">{thinkingLabel}</span>
            )}
          </>
        )}

        {!isUser && message.content && message.status !== "streaming" && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? copiedLabel : copyLabel}
            className="absolute -bottom-1 right-1 flex size-7 cursor-pointer items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-200 hover:text-slate-700"
          >
            {copied ? (
              <HiOutlineClipboardDocumentCheck size={14} />
            ) : (
              <HiOutlineClipboard size={14} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-hidden>
      <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:0ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
    </div>
  );
}

function PhaseIndicator({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 py-0.5 text-slate-500">
      <span
        className="size-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500"
        aria-hidden
      />
      <span>{label}</span>
    </p>
  );
}
