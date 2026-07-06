"use client";

import { useLanguage } from "@/context/TextContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { chat } from "@/utils/data";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import ChatLauncher from "./ChatLauncher";
import ChatPanel from "./ChatPanel";
import type { ChatMessage } from "@/lib/chat/types";

const launcherAnchorClass =
  "fixed right-4 z-50 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]";

/** Desktop popover: prefer 620px tall, 430px wide; shrink on small viewports. */
const desktopPopoverClass =
  "flex h-[min(620px,calc(100dvh-5rem-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px)))] max-h-[calc(100dvh-5rem-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden overscroll-y-contain rounded-2xl border-slate-200 p-0 shadow-xl";

type ChatResponsiveShellProps = {
  open: boolean;
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
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
  onClose: () => void;
  onToggle: () => void;
  onSend: (text: string) => void;
  onAbort: () => void;
  onToggleReasoning: (messageId: string) => void;
};

export default function ChatResponsiveShell({
  open,
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
  inputDisabled,
  inputDisabledPlaceholder,
  onLoadOlder,
  onDesktopOpenChange,
  onMobileOpenChange,
  onClose,
  onToggle,
  onSend,
  onAbort,
  onToggleReasoning,
}: ChatResponsiveShellProps) {
  const { language } = useLanguage();
  const { matches: isDesktop, mounted } = useMediaQuery("(min-width: 768px)");
  const launcherLabel = chat.launcherLabel[language];

  const panelProps = {
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
    inputDisabled,
    inputDisabledPlaceholder,
    onLoadOlder,
    onClose,
    onSend,
    onAbort,
    onToggleReasoning,
    autoFocusInput: open,
  };

  if (!mounted) {
    return (
      <div className={launcherAnchorClass}>
        <ChatLauncher open={open} label={launcherLabel} onToggle={onToggle} />
      </div>
    );
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onDesktopOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div className={launcherAnchorClass}>
            <ChatLauncher open={open} label={launcherLabel} onToggle={onToggle} />
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={16}
          collisionPadding={16}
          onInteractOutside={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => event.preventDefault()}
          className={desktopPopoverClass}
          onWheel={(event) => event.stopPropagation()}
        >
          <ChatPanel {...panelProps} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <>
      <div className={launcherAnchorClass}>
        <ChatLauncher open={open} label={launcherLabel} onToggle={onToggle} />
      </div>
      <Drawer open={open} onOpenChange={onMobileOpenChange}>
        <DrawerContent className="flex h-[85dvh] max-h-[85dvh] flex-col p-0">
          <ChatPanel {...panelProps} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
