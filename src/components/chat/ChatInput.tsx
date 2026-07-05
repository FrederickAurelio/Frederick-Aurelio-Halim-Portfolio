"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HiPaperAirplane, HiStop } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type ChatInputProps = {
  placeholder: string;
  sendLabel: string;
  stopLabel: string;
  isLoading: boolean;
  onSend: (text: string) => void;
  onAbort: () => void;
  autoFocus?: boolean;
};

const MAX_TEXTAREA_HEIGHT = 120;
const MIN_TEXTAREA_HEIGHT = 44;

export default function ChatInput({
  placeholder,
  sendLabel,
  stopLabel,
  isLoading,
  onSend,
  onAbort,
  autoFocus = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    const wrapper = wrapperRef.current;
    if (!el || !wrapper) return;

    const scrollTop = el.scrollTop;
    el.style.height = "0px";
    const scrollHeight = el.scrollHeight;
    const nextHeight = Math.min(
      Math.max(scrollHeight, MIN_TEXTAREA_HEIGHT),
      MAX_TEXTAREA_HEIGHT,
    );

    el.style.height = `${nextHeight}px`;
    wrapper.style.height = `${nextHeight}px`;
    el.style.overflowY =
      scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
    el.scrollTop = scrollTop;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [value, resizeTextarea]);

  useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const handleSubmit = () => {
    if (isLoading) {
      onAbort();
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current && wrapperRef.current) {
      textareaRef.current.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      textareaRef.current.style.overflowY = "hidden";
      wrapperRef.current.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        <div
          ref={wrapperRef}
          className={cn(
            "flex min-h-[44px] max-h-[120px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-colors",
            "focus-within:border-sky-400 focus-within:bg-white",
            isLoading && "opacity-60",
          )}
          style={{ height: MIN_TEXTAREA_HEIGHT }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={isLoading}
            className="chat-textarea block size-full min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isLoading && !value.trim()}
          aria-label={isLoading ? stopLabel : sendLabel}
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-sky-500 text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? <HiStop size={18} /> : <HiPaperAirplane size={18} />}
        </button>
      </div>
    </div>
  );
}
