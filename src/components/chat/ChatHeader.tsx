"use client";

import { HiXMark } from "react-icons/hi2";

type ChatHeaderProps = {
  title: string;
  closeLabel: string;
  showHandle?: boolean;
  onClose: () => void;
};

export default function ChatHeader({
  title,
  closeLabel,
  showHandle = false,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white">
      {showHandle && (
        <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
      )}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 id="chat-panel-title" className="text-sm font-semibold text-slate-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <HiXMark size={20} />
        </button>
      </div>
    </div>
  );
}
