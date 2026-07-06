"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ChatMessage } from "@/lib/chat/types";
import ChatEmptyState from "./ChatEmptyState";
import ChatMessageBubble from "./ChatMessageBubble";
import ChatSpinner from "./ChatSpinner";

const STICK_TO_BOTTOM_THRESHOLD_PX = 80;
const LOAD_OLDER_THRESHOLD_PX = 32;

function canScrollInDirection(element: HTMLElement, deltaY: number): boolean {
  const { scrollTop, scrollHeight, clientHeight } = element;
  if (scrollHeight <= clientHeight) return false;
  if (deltaY < 0) return scrollTop > 0;
  return scrollTop + clientHeight < scrollHeight - 1;
}

function findNestedScrollable(
  target: EventTarget | null,
  boundary: HTMLElement,
): HTMLElement | null {
  let node = target instanceof HTMLElement ? target : null;

  while (node && node !== boundary) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

type ChatMessageListProps = {
  messages: ChatMessage[];
  emptyTitle: string;
  emptyDescription: string;
  copyLabel: string;
  copiedLabel: string;
  thinkingLabel: string;
  thinkingDoneLabel: string;
  retrievingLabel: string;
  routingLabel: string;
  showThinkingLabel: string;
  hideThinkingLabel: string;
  isLoading: boolean;
  isLoadingHistory: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadOlder: () => void;
  onToggleReasoning: (messageId: string) => void;
};

export default function ChatMessageList({
  messages,
  emptyTitle,
  emptyDescription,
  copyLabel,
  copiedLabel,
  thinkingLabel,
  thinkingDoneLabel,
  retrievingLabel,
  routingLabel,
  showThinkingLabel,
  hideThinkingLabel,
  isLoading,
  isLoadingHistory,
  hasNextPage,
  isFetchingNextPage,
  onLoadOlder,
  onToggleReasoning,
}: ChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const loadingOlderLockRef = useRef(false);
  const prependAnchorRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);

  useEffect(() => {
    if (!isFetchingNextPage) {
      loadingOlderLockRef.current = false;
    }
  }, [isFetchingNextPage]);

  const tryLoadOlder = useCallback(() => {
    const el = listRef.current;
    if (
      !el ||
      !hasNextPage ||
      isFetchingNextPage ||
      loadingOlderLockRef.current ||
      prependAnchorRef.current ||
      el.scrollTop > LOAD_OLDER_THRESHOLD_PX
    ) {
      return;
    }

    loadingOlderLockRef.current = true;
    prependAnchorRef.current = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
    };
    stickToBottomRef.current = false;
    onLoadOlder();
  }, [hasNextPage, isFetchingNextPage, onLoadOlder]);

  const scrollKey = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.status === "streaming") {
        return `${message.id}:${message.content.length}:${message.reasoning?.length ?? 0}`;
      }
    }
    return messages.length > 0 ? "complete" : "empty";
  }, [messages]);

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const anchor = prependAnchorRef.current;
    if (anchor) {
      if (isFetchingNextPage) return;

      const delta = el.scrollHeight - anchor.scrollHeight;
      if (delta > 0) {
        el.scrollTop = anchor.scrollTop + delta;
      }
      prependAnchorRef.current = null;
      return;
    }

    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [scrollKey, isFetchingNextPage]);

  useEffect(() => {
    if (!isLoading) return;
    stickToBottomRef.current = true;
  }, [isLoading]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      const nested = findNestedScrollable(event.target, el);
      if (nested && canScrollInDirection(nested, event.deltaY)) {
        event.stopPropagation();
        return;
      }

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

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;

    if (!prependAnchorRef.current) {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottomRef.current =
        distanceFromBottom <= STICK_TO_BOTTOM_THRESHOLD_PX;
    }

    tryLoadOlder();
  };

  if (isLoadingHistory && messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overscroll-y-contain">
        <ChatSpinner />
      </div>
    );
  }

  if (!isLoadingHistory && messages.length === 0) {
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
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3"
    >
      {isFetchingNextPage && (
        <div className="mb-2 flex justify-center">
          <ChatSpinner />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            thinkingLabel={thinkingLabel}
            thinkingDoneLabel={thinkingDoneLabel}
            retrievingLabel={retrievingLabel}
            routingLabel={routingLabel}
            showThinkingLabel={showThinkingLabel}
            hideThinkingLabel={hideThinkingLabel}
            onToggleReasoning={onToggleReasoning}
          />
        ))}
      </div>
    </div>
  );
}
