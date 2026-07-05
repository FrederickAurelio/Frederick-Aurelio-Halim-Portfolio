"use client";

import { useChat } from "@/hooks/useChat";
import { useChatOpenState } from "@/hooks/useChatOpenState";
import ChatResponsiveShell from "./ChatResponsiveShell";

export default function ChatWidget() {
  const { open, ready, toggle, close, handleDesktopOpenChange, handleMobileOpenChange } =
    useChatOpenState();
  const { messages, isLoading, showSuggestions, sendMessage, abort } =
    useChat();

  if (!ready) return null;

  return (
    <ChatResponsiveShell
      open={open}
      messages={messages}
      isLoading={isLoading}
      showSuggestions={showSuggestions}
      onDesktopOpenChange={handleDesktopOpenChange}
      onMobileOpenChange={handleMobileOpenChange}
      onClose={close}
      onToggle={toggle}
      onSend={sendMessage}
      onAbort={abort}
    />
  );
}
