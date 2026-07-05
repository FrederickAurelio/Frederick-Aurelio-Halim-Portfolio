"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getInitialChatOpen,
  isDesktopViewport,
  setChatOpenPreference,
} from "@/lib/chat/storage";

export function useChatOpenState() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setOpen(getInitialChatOpen());
      setReady(true);
    });
  }, []);

  const toggle = useCallback(() => {
    setOpen((current) => {
      const next = !current;
      setChatOpenPreference(next);
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setChatOpenPreference(false);
  }, []);

  const handleDesktopOpenChange = useCallback((next: boolean) => {
    if (next) {
      setOpen(true);
      if (isDesktopViewport()) setChatOpenPreference(true);
    }
  }, []);

  const handleMobileOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!isDesktopViewport()) setChatOpenPreference(next);
  }, []);

  return {
    open,
    ready,
    toggle,
    close,
    handleDesktopOpenChange,
    handleMobileOpenChange,
  };
}
