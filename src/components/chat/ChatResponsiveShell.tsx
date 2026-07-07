"use client";

import { useCallback, useRef, useState } from "react";
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

/** Desktop popover: prefer 620px tall; on short vh keep 1rem top gap + room for launcher. */
const desktopPopoverClass =
  "flex h-[min(620px,calc(100dvh-1.5rem-5.5rem-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px)))] max-h-[calc(100dvh-1rem-5.5rem-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px))] w-[min(430px,calc(100vw-2rem))] flex-col overflow-hidden overscroll-y-contain rounded-2xl border-slate-200 p-0 shadow-xl";

/** Extra buffer after Vaul reports animation end before focusing input. */
const MOBILE_FOCUS_AFTER_ANIMATION_MS = 50;
/** Vaul open animation duration; used when opening via launcher (no onAnimationEnd). */
const VAUL_DRAWER_ANIMATION_MS = 500;

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
  const [mobileDrawerReady, setMobileDrawerReady] = useState(false);
  const focusTimerRef = useRef<number | null>(null);
  const launcherFallbackTimerRef = useRef<number | null>(null);
  const launcherLabel = chat.launcherLabel[language];

  const clearFocusTimers = useCallback(() => {
    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
    if (launcherFallbackTimerRef.current !== null) {
      window.clearTimeout(launcherFallbackTimerRef.current);
      launcherFallbackTimerRef.current = null;
    }
  }, []);

  const clearMobileFocus = useCallback(() => {
    clearFocusTimers();
    setMobileDrawerReady(false);
  }, [clearFocusTimers]);

  const handleDrawerAnimationEnd = useCallback((isOpen: boolean) => {
    if (launcherFallbackTimerRef.current !== null) {
      window.clearTimeout(launcherFallbackTimerRef.current);
      launcherFallbackTimerRef.current = null;
    }
    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }

    if (!isOpen) {
      setMobileDrawerReady(false);
      return;
    }

    focusTimerRef.current = window.setTimeout(() => {
      setMobileDrawerReady(true);
      focusTimerRef.current = null;
    }, MOBILE_FOCUS_AFTER_ANIMATION_MS);
  }, []);

  const scheduleLauncherOpenFocus = useCallback(() => {
    if (launcherFallbackTimerRef.current !== null) {
      window.clearTimeout(launcherFallbackTimerRef.current);
    }

    launcherFallbackTimerRef.current = window.setTimeout(() => {
      launcherFallbackTimerRef.current = null;
      handleDrawerAnimationEnd(true);
    }, VAUL_DRAWER_ANIMATION_MS);
  }, [handleDrawerAnimationEnd]);

  const handleMobileOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) clearMobileFocus();
      onMobileOpenChange(nextOpen);
    },
    [clearMobileFocus, onMobileOpenChange],
  );

  const handleToggle = useCallback(() => {
    if (!open) {
      clearMobileFocus();
      onToggle();
      scheduleLauncherOpenFocus();
      return;
    }
    clearMobileFocus();
    onToggle();
  }, [clearMobileFocus, open, onToggle, scheduleLauncherOpenFocus]);

  const handleClose = useCallback(() => {
    clearMobileFocus();
    onClose();
  }, [clearMobileFocus, onClose]);

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
    onClose: handleClose,
    onSend,
    onAbort,
    onToggleReasoning,
    autoFocusInput: open && (isDesktop || mobileDrawerReady),
  };

  if (!mounted) {
    return (
      <div className={launcherAnchorClass}>
        <ChatLauncher open={open} label={launcherLabel} onToggle={handleToggle} />
      </div>
    );
  }

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onDesktopOpenChange} modal={false}>
        <PopoverAnchor asChild>
          <div className={launcherAnchorClass}>
            <ChatLauncher open={open} label={launcherLabel} onToggle={handleToggle} />
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={16}
          collisionPadding={{ top: 16, right: 16, bottom: 16, left: 16 }}
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
        <ChatLauncher open={open} label={launcherLabel} onToggle={handleToggle} />
      </div>
      <Drawer
        open={open}
        onOpenChange={handleMobileOpenChange}
        onAnimationEnd={handleDrawerAnimationEnd}
      >
        <DrawerContent className="flex h-[92dvh] max-h-[92dvh] flex-col p-0">
          <ChatPanel {...panelProps} />
        </DrawerContent>
      </Drawer>
    </>
  );
}
