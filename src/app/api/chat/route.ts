import { NextResponse } from "next/server";
import {
  releaseGeneration,
  tryAcquireGeneration,
} from "@/lib/chat/generation-registry";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { getChatStore } from "@/lib/chat-store";
import { GENERATION_IN_PROGRESS_CODE } from "@/lib/chat/types";
import { createChatCompletionStream } from "@/lib/openrouter/client";
import { getOpenRouterConfig } from "@/lib/openrouter/config";
import {
  CHAT_SSE_HEADERS,
  transformOpenRouterStream,
} from "@/lib/openrouter/stream-transform";
import type { ChatApiRequest } from "@/lib/chat/types";

export async function POST(request: Request) {
  let sessionId: string | null = null;
  let lockHeld = false;

  try {
    if (!getOpenRouterConfig()) {
      return NextResponse.json(
        { error: "Chat is not configured" },
        { status: 503 },
      );
    }

    sessionId = await requireSessionId();
    const activeSessionId = sessionId;
    const store = getChatStore();

    const body = (await request.json()) as ChatApiRequest;
    const content = body.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    const createdAt = Date.now();

    const generationController = await tryAcquireGeneration(
      activeSessionId,
      assistantMessageId,
    );

    if (!generationController) {
      return NextResponse.json(
        { error: GENERATION_IN_PROGRESS_CODE },
        { status: 409 },
      );
    }

    lockHeld = true;

    const history = await store.getOpenRouterHistory(activeSessionId);

    await store.appendMessage(activeSessionId, {
      id: userMessageId,
      role: "user",
      content,
      createdAt,
    });

    const upstream = await createChatCompletionStream({
      messages: [...history, { role: "user", content }],
      signal: generationController.signal,
    });

    if (!upstream.ok) {
      await releaseGeneration(activeSessionId);
      lockHeld = false;

      let errorMessage = "Upstream request failed";
      try {
        const errorBody = (await upstream.json()) as {
          error?: { message?: string };
        };
        errorMessage = errorBody.error?.message ?? errorMessage;
      } catch {
        // Use default error message
      }

      const status =
        upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;

      return NextResponse.json({ error: errorMessage }, { status });
    }

    let reasoning = "";
    let assistantContent = "";

    const onGenerationEnd = async () => {
      try {
        if (assistantContent || reasoning) {
          await store.appendMessage(activeSessionId, {
            id: assistantMessageId,
            role: "assistant",
            content: assistantContent,
            reasoning: reasoning || undefined,
            createdAt: Date.now(),
          });
        }
      } finally {
        await releaseGeneration(activeSessionId);
        lockHeld = false;
      }
    };

    return new Response(
      transformOpenRouterStream(upstream.body, {
        savedPayload: { userMessageId, assistantMessageId },
        shouldStop: () => store.isGenerationStopRequested(activeSessionId),
        onThinkingDelta: (delta) => {
          reasoning += delta;
        },
        onContentDelta: (delta) => {
          assistantContent += delta;
        },
        onGenerationEnd: async () => {
          await onGenerationEnd();
        },
      }),
      { headers: CHAT_SSE_HEADERS },
    );
  } catch (error) {
    if (sessionId && lockHeld) {
      await releaseGeneration(sessionId);
    }

    if (error instanceof SessionError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "OPENROUTER_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Chat is not configured" },
        { status: 503 },
      );
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
