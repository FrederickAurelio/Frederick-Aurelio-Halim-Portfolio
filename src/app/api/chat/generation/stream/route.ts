import { NextResponse, type NextRequest } from "next/server";
import { createGenerationSubscribeStream } from "@/lib/chat/generation-subscribe-stream";
import { createChatSseResponse } from "@/lib/chat/create-chat-sse-response";
import { mapChatRouteError } from "@/lib/chat/map-route-error";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { prepareChatStore } from "@/lib/chat-store/api";
import { NO_ACTIVE_GENERATION_CODE } from "@/lib/chat/types";

export const maxDuration = 180;

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

    return createChatSseResponse(
      createGenerationSubscribeStream({
        sessionId,
        store,
        signal: request.signal,
      }),
      request,
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
