"use client";

import { useCallback, useRef, useState } from "react";
import type {
  ChatApiMessage,
  ChatMessage,
  ChatStatus,
} from "@/lib/chat/types";

function createMessage(
  role: ChatMessage["role"],
  content: string,
  status: ChatMessage["status"] = "complete",
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    status,
    createdAt: Date.now(),
  };
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);

  const showSuggestions = messages.length === 0 && status === "idle";

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
    setMessages((prev) =>
      prev.map((message) =>
        message.status === "streaming"
          ? { ...message, status: "complete" as const }
          : message,
      ),
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || status !== "idle") return;

      const userMessage = createMessage("user", trimmed);
      const assistantId = crypto.randomUUID();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        createdAt: Date.now(),
      };

      const historyForApi: ChatApiMessage[] = [
        ...messages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        { role: "user", content: trimmed },
      ];

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setStatus("submitting");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: historyForApi }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 499) return;
          throw new Error("Request failed");
        }

        setStatus("streaming");
        const data = (await response.json()) as { content: string };

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: data.content,
                  status: "complete" as const,
                }
              : message,
          ),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  role: "error" as const,
                  content: "Something went wrong. Try again.",
                  status: "error" as const,
                }
              : message,
          ),
        );
      } finally {
        abortRef.current = null;
        setStatus("idle");
      }
    },
    [messages, status],
  );

  const isLoading = status === "submitting" || status === "streaming";

  return {
    messages,
    status,
    isLoading,
    showSuggestions,
    sendMessage,
    abort,
  };
}
