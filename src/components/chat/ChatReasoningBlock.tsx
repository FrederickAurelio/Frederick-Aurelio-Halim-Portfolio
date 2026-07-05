"use client";

import { useLayoutEffect, useRef } from "react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { cn } from "@/lib/utils";

const STICK_TO_BOTTOM_THRESHOLD_PX = 24;

type ChatReasoningBlockProps = {
  reasoning: string;
  isStreaming: boolean;
  hasContent: boolean;
  expanded: boolean;
  thinkingLabel: string;
  thinkingDoneLabel: string;
  showThinkingLabel: string;
  hideThinkingLabel: string;
  onToggle: () => void;
};

export default function ChatReasoningBlock({
  reasoning,
  isStreaming,
  hasContent,
  expanded,
  thinkingLabel,
  thinkingDoneLabel,
  showThinkingLabel,
  hideThinkingLabel,
  onToggle,
}: ChatReasoningBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const wasThinkingPhaseRef = useRef(false);

  const isThinkingPhase = isStreaming && !hasContent;
  const isExpanded = isThinkingPhase || expanded;
  const headerLabel = isThinkingPhase ? thinkingLabel : thinkingDoneLabel;
  const toggleLabel = isExpanded ? hideThinkingLabel : showThinkingLabel;

  useLayoutEffect(() => {
    if (isThinkingPhase && !wasThinkingPhaseRef.current) {
      stickToBottomRef.current = true;
    }
    wasThinkingPhaseRef.current = isThinkingPhase;
  }, [isThinkingPhase]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !isExpanded) return;

    if (stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [reasoning, isExpanded]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current =
      distanceFromBottom <= STICK_TO_BOTTOM_THRESHOLD_PX;
  };

  return (
    <div className="mb-2 border-b border-slate-200/80 pb-2 last:mb-0">
      <button
        type="button"
        onClick={onToggle}
        disabled={isThinkingPhase}
        aria-expanded={isExpanded}
        aria-label={isThinkingPhase ? headerLabel : toggleLabel}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-slate-500",
          !isThinkingPhase && "cursor-pointer hover:text-slate-700",
          isThinkingPhase && "cursor-default",
        )}
      >
        <span className={cn(isThinkingPhase && "animate-pulse")}>{headerLabel}</span>
        {!isThinkingPhase && (
          <span className="shrink-0 text-slate-400">
            {isExpanded ? <HiChevronUp size={14} /> : <HiChevronDown size={14} />}
          </span>
        )}
      </button>

      {isExpanded && (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onWheel={(event) => event.stopPropagation()}
          className="mt-2 max-h-40 min-h-0 overflow-y-auto overscroll-y-contain rounded-lg bg-slate-50/80 px-2.5 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-600"
        >
          {reasoning}
        </div>
      )}
    </div>
  );
}
