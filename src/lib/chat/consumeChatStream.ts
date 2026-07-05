import { createParser } from "eventsource-parser";

import type { ChatSavedEvent } from "@/lib/chat/types";

export type ChatStreamCallbacks = {
  onThinking?: (delta: string) => void;
  onContent?: (delta: string) => void;
  onSaved?: (payload: ChatSavedEvent) => void;
  onDone?: () => void;
  onError?: (message: string, status?: number) => void;
};

type StreamPayload = {
  delta?: string;
  message?: string;
  userMessageId?: string;
  assistantMessageId?: string;
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string | { message?: string } };
    if (typeof body.error === "string") return body.error;
    if (body.error && typeof body.error.message === "string") {
      return body.error.message;
    }
  } catch {
    // Fall through to default
  }

  return `Request failed (${response.status})`;
}

export async function consumeChatStream(
  url: string,
  init: RequestInit,
  callbacks: ChatStreamCallbacks,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    callbacks.onError?.(
      error instanceof Error ? error.message : "Network request failed",
    );
    return;
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    callbacks.onError?.(message, response.status);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.("Response body is not readable");
    return;
  }

  const decoder = new TextDecoder();
  let streamError: string | null = null;

  const parser = createParser({
    onEvent(event) {
      if (!event.data) return;

      let payload: StreamPayload;
      try {
        payload = JSON.parse(event.data) as StreamPayload;
      } catch {
        return;
      }

      switch (event.event) {
        case "thinking":
          if (payload.delta) callbacks.onThinking?.(payload.delta);
          break;
        case "content":
          if (payload.delta) callbacks.onContent?.(payload.delta);
          break;
        case "saved":
          if (payload.userMessageId && payload.assistantMessageId) {
            callbacks.onSaved?.({
              userMessageId: payload.userMessageId,
              assistantMessageId: payload.assistantMessageId,
            });
          }
          break;
        case "done":
          callbacks.onDone?.();
          break;
        case "error":
          streamError = payload.message ?? "Stream error";
          break;
        default:
          break;
      }
    },
  });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.feed(decoder.decode(value, { stream: true }));
    }

    parser.feed(decoder.decode());

    if (streamError) {
      callbacks.onError?.(streamError);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    callbacks.onError?.(
      error instanceof Error ? error.message : "Stream read failed",
    );
  } finally {
    reader.releaseLock();
  }
}
