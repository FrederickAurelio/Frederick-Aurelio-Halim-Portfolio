import type { ChatStreamPhase } from "@/lib/chat/types";

export const CHAT_SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export type SseController = ReadableStreamDefaultController<Uint8Array>;

function encodeSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function safeEnqueue(
  controller: SseController,
  encoder: TextEncoder,
  event: string,
  data: unknown,
): void {
  try {
    controller.enqueue(encoder.encode(encodeSseEvent(event, data)));
  } catch {
    // Client disconnected — keep reading upstream and saving server-side.
  }
}

export function emitThinkingDelta(
  controller: SseController,
  encoder: TextEncoder,
  delta: string,
): void {
  if (!delta) return;
  safeEnqueue(controller, encoder, "thinking", { delta });
}

export function emitContentDelta(
  controller: SseController,
  encoder: TextEncoder,
  delta: string,
): void {
  if (!delta) return;
  safeEnqueue(controller, encoder, "content", { delta });
}

export function emitSuggestions(
  controller: SseController,
  encoder: TextEncoder,
  items: string[],
): void {
  safeEnqueue(controller, encoder, "suggestions", { items });
}

export function emitDone(
  controller: SseController,
  encoder: TextEncoder,
  payload: Record<string, unknown> = {},
): void {
  safeEnqueue(controller, encoder, "done", payload);
}

export function emitChatPhase(
  controller: SseController,
  encoder: TextEncoder,
  phase: ChatStreamPhase | undefined,
  options?: { onPhase?: (phase: ChatStreamPhase) => void },
): void {
  if (!phase) return;

  options?.onPhase?.(phase);

  if (phase === "routing" || phase === "retrieving") {
    safeEnqueue(controller, encoder, phase, {});
  }

  safeEnqueue(controller, encoder, "phase", { phase });
}
