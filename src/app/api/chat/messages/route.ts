import { NextResponse } from "next/server";
import { injectGeneratingAssistant } from "@/lib/chat/inject-generating-message";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { getChatStore } from "@/lib/chat-store";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function GET(request: Request) {
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

    const store = getChatStore();

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

    return NextResponse.json(withGenerating);
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
