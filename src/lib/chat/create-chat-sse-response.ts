import type { NextRequest } from "next/server";
import { appendUpstashSyncCookieHeader } from "@/lib/chat-store/upstash-sync.server";
import { isUpstashProvider } from "@/lib/chat-store";
import { CHAT_SSE_HEADERS } from "@/lib/chat/sse";

export function createChatSseResponse(
  stream: ReadableStream<Uint8Array>,
  request: NextRequest,
): Response {
  const streamHeaders = new Headers(CHAT_SSE_HEADERS);
  if (isUpstashProvider()) {
    appendUpstashSyncCookieHeader(streamHeaders, request);
  }

  return new Response(stream, { headers: streamHeaders });
}
