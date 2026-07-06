import { createParser } from "eventsource-parser";

import {
  parseChatErrorResponse,
  toNetworkChatApiError,
} from "@/lib/chat/api-error";
import { CHAT_ERROR_CODES, type ChatErrorCode } from "@/lib/chat/api-errors";
import type { ChatSavedEvent, ChatStreamPhase, ChatSyncEvent } from "@/lib/chat/types";
import { chatApiHeaders, setUpstashSyncToken } from "@/lib/chat/fetch-messages";

export type ChatStreamCallbacks = {
  onThinking?: (delta: string) => void;
  onContent?: (delta: string) => void;
  onSaved?: (payload: ChatSavedEvent) => void;
  onSync?: (payload: ChatSyncEvent) => void;
  onRetrieving?: () => void;
  onRouting?: () => void;
  onPhase?: (phase: ChatStreamPhase) => void;
  onSuggestions?: (items: string[]) => void;
  onDone?: () => void;
  onError?: (message: string, status?: number, code?: ChatErrorCode) => void;
};

type StreamPayload = {
  delta?: string;
  message?: string;
  userMessageId?: string;
  assistantMessageId?: string;
  content?: string;
  reasoning?: string;
  seq?: number;
  streamPhase?: string;
  phase?: string;
  items?: string[];
  upstashSyncToken?: string;
};

const STREAM_ENDED_UNEXPECTEDLY = "STREAM_ENDED_UNEXPECTEDLY";

function parseStreamPhase(value: string | undefined): ChatStreamPhase | undefined {
  if (
    value === "routing" ||
    value === "retrieving" ||
    value === "thinking" ||
    value === "content"
  ) {
    return value;
  }
  return undefined;
}

function applyDonePayload(payload: StreamPayload): void {
  if (typeof payload.upstashSyncToken === "string" && payload.upstashSyncToken) {
    setUpstashSyncToken(payload.upstashSyncToken);
  }
}

function mergeChatApiHeaders(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(chatApiHeaders())) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  return { ...init, headers };
}

export async function consumeChatStream(
  url: string,
  init: RequestInit,
  callbacks: ChatStreamCallbacks,
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(url, mergeChatApiHeaders(init));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    const apiError = toNetworkChatApiError(error);
    callbacks.onError?.(apiError.message, apiError.status, apiError.code);
    return;
  }

  if (!response.ok) {
    const apiError = await parseChatErrorResponse(response);
    callbacks.onError?.(apiError.message, apiError.status, apiError.code);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError?.("Response body is not readable");
    return;
  }

  const decoder = new TextDecoder();
  let streamError: string | null = null;
  let doneReceived = false;

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
        case "retrieving":
          callbacks.onRetrieving?.();
          break;
        case "routing":
          callbacks.onRouting?.();
          break;
        case "phase": {
          const phase = parseStreamPhase(payload.phase);
          if (phase) callbacks.onPhase?.(phase);
          break;
        }
        case "suggestions":
          if (Array.isArray(payload.items)) {
            callbacks.onSuggestions?.(
              payload.items.filter((s): s is string => typeof s === "string"),
            );
          }
          break;
        case "sync":
          if (
            typeof payload.content === "string" &&
            typeof payload.reasoning === "string" &&
            typeof payload.seq === "number"
          ) {
            callbacks.onSync?.({
              content: payload.content,
              reasoning: payload.reasoning,
              seq: payload.seq,
              streamPhase: parseStreamPhase(payload.streamPhase),
            });
          }
          break;
        case "done":
          doneReceived = true;
          applyDonePayload(payload);
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
      return;
    }

    if (!doneReceived) {
      callbacks.onError?.(
        STREAM_ENDED_UNEXPECTEDLY,
        undefined,
        CHAT_ERROR_CODES.GENERIC,
      );
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
