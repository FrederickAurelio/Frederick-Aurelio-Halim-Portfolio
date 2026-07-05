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

type ChatResponsiveShellProps = {
  open: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  showSuggestions: boolean;
  onDesktopOpenChange: (open: boolean) => void;
  onMobileOpenChange: (open: boolean) => void;
  onClose: () => void;
  onToggle: () => void;
  onSend: (text: string) => void;
  onAbort: () => void;
};

export default function ChatResponsiveShell({
  open,
  messages,
  isLoading,
  showSuggestions,
  onDesktopOpenChange,
  onMobileOpenChange,
  onClose,
  onToggle,
  onSend,
  onAbort,
}: ChatResponsiveShellProps) {
  const { language } = useLanguage();
  const { matches: isDesktop, mounted } = useMediaQuery("(min-width: 768px)");
  const launcherLabel = chat.launcherLabel[language];

  const panelProps = {
    messages,
    isLoading,
    showSuggestions,
    onClose,
    onSend,
    onAbort,
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
          className="flex h-[536px] w-[392px] flex-col overflow-hidden overscroll-y-contain rounded-2xl border-slate-200 p-0 shadow-xl"
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
