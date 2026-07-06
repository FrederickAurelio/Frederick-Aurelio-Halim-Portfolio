import { NextResponse, type NextRequest } from "next/server";
import { stopActiveGeneration } from "@/lib/chat/generation-registry";
import { mapChatRouteError } from "@/lib/chat/map-route-error";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import {
  finalizeChatJsonResponse,
  prepareChatStore,
} from "@/lib/chat-store/api";

export async function POST(request: NextRequest) {
  try {
    const sessionId = await requireSessionId(request);
    await prepareChatStore();
    const stopped = await stopActiveGeneration(sessionId);
    return finalizeChatJsonResponse(
      NextResponse.json({ stopped }),
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
