import { NextResponse } from "next/server";
import { stopActiveGeneration } from "@/lib/chat/generation-registry";
import { SessionError, requireSessionId } from "@/lib/chat/session";

export async function POST() {
  try {
    const sessionId = await requireSessionId();
    const stopped = await stopActiveGeneration(sessionId);
    return NextResponse.json({ stopped });
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
