import { NextResponse, type NextRequest } from "next/server";
import { injectGeneratingAssistant } from "@/lib/chat/inject-generating-message";
import { mapChatRouteError } from "@/lib/chat/map-route-error";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import {
  finalizeChatJsonResponse,
  prepareChatStore,
} from "@/lib/chat-store/api";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const sessionId = await requireSessionId();
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number.parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT,
    );
    const beforeRaw = searchParams.get("before");
    const before = beforeRaw ? Number.parseInt(beforeRaw, 10) : null;
    const isLatestPage = before === null || !Number.isFinite(before);

    const store = await prepareChatStore();

    const result =
      before !== null && Number.isFinite(before)
        ? await store.getMessagesBefore(sessionId, before, limit)
        : await store.getLatestMessages(sessionId, limit);

    const withGenerating = await injectGeneratingAssistant(
      sessionId,
      store,
      result,
      isLatestPage,
    );

    return finalizeChatJsonResponse(
      NextResponse.json(withGenerating),
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
