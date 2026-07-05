"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { HiOutlineClipboard, HiOutlineClipboardDocumentCheck } from "react-icons/hi2";
import type { ChatMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

type ChatMessageBubbleProps = {
  message: ChatMessage;
  copyLabel: string;
  copiedLabel: string;
};

export default function ChatMessageBubble({
  message,
  copyLabel,
  copiedLabel,
}: ChatMessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.role === "error";
  const isStreaming = message.status === "streaming" && !message.content;

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
        ) : isStreaming ? (
          <TypingDots />
        ) : (
          <div className="chat-markdown break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 underline"
                  >
                    {children}
                  </a>
                ),
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => (
                  <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
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
