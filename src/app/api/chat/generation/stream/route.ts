import { NextResponse } from "next/server";
import {
  createGenerationSubscribeStream,
  CHAT_SSE_HEADERS,
} from "@/lib/chat/generation-subscribe-stream";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { getChatStore } from "@/lib/chat-store";
import { NO_ACTIVE_GENERATION_CODE } from "@/lib/chat/types";

export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    const sessionId = await requireSessionId();
    const store = getChatStore();

    const locked = await store.isGenerationLocked(sessionId);
    if (!locked) {
      return NextResponse.json(
        { error: NO_ACTIVE_GENERATION_CODE },
        { status: 404 },
      );
    }

    return new Response(
      createGenerationSubscribeStream({
        sessionId,
        store,
        signal: request.signal,
      }),
      { headers: CHAT_SSE_HEADERS },
    );
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message.includes("not configured")) {
      return NextResponse.json(
        { error: "Chat storage is not configured" },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
