import { NextResponse, type NextRequest } from "next/server";
import {
  createGenerationSubscribeStream,
  CHAT_SSE_HEADERS,
} from "@/lib/chat/generation-subscribe-stream";
import { mapChatRouteError } from "@/lib/chat/map-route-error";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { prepareChatStore } from "@/lib/chat-store/api";
import { appendUpstashSyncCookieHeader } from "@/lib/chat-store/upstash-sync.server";
import { isUpstashProvider } from "@/lib/chat-store";
import { NO_ACTIVE_GENERATION_CODE } from "@/lib/chat/types";

export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    const sessionId = await requireSessionId(request);
    const store = await prepareChatStore();

    const locked = await store.isGenerationLocked(sessionId);
    if (!locked) {
      return NextResponse.json(
        { error: NO_ACTIVE_GENERATION_CODE, code: CHAT_ERROR_CODES.GENERIC },
        { status: 404 },
      );
    }

    const streamHeaders = new Headers(CHAT_SSE_HEADERS);
    if (isUpstashProvider()) {
      appendUpstashSyncCookieHeader(streamHeaders, request);
    }

    return new Response(
      createGenerationSubscribeStream({
        sessionId,
        store,
        signal: request.signal,
      }),
      { headers: streamHeaders },
    );
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json(
        { error: "Unauthorized", code: CHAT_ERROR_CODES.UNAUTHORIZED },
        { status: 401 },
      );
    }

    const mapped = mapChatRouteError(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
