"use client";

import { HiChatBubbleLeftRight } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type ChatLauncherProps = {
  open: boolean;
  label: string;
  onToggle: () => void;
};

export default function ChatLauncher({ open, label, onToggle }: ChatLauncherProps) {
  return (
    <div className="relative size-14">
      {!open && (
        <span
          aria-hidden
          className="chat-launcher-ring pointer-events-none absolute inset-0 rounded-full bg-sky-400/30 animate-chat-launcher-ring"
        />
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          "chat-launcher-button relative flex size-14 cursor-pointer items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition-transform duration-200 hover:scale-105",
          !open && "animate-chat-launcher-pulse",
        )}
      >
        <HiChatBubbleLeftRight
          size={26}
          className={cn(
            "transition-transform duration-200",
            open && "scale-90",
          )}
        />
      </button>
    </div>
  );
}
