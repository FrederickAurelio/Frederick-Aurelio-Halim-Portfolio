"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import ChatEmptyState from "./ChatEmptyState";
import ChatMessageBubble from "./ChatMessageBubble";

type ChatMessageListProps = {
  messages: ChatMessage[];
  emptyTitle: string;
  emptyDescription: string;
  copyLabel: string;
  copiedLabel: string;
  isLoading: boolean;
};

export default function ChatMessageList({
  messages,
  emptyTitle,
  emptyDescription,
  copyLabel,
  copiedLabel,
  isLoading,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
        event.preventDefault();
      }
      event.stopPropagation();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-y-contain"
        onWheel={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <ChatEmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3"
    >
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
        ))}
      </div>
    </div>
  );
}
