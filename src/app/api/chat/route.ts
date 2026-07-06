import { NextResponse } from "next/server";
import {
  releaseGeneration,
  tryAcquireGeneration,
} from "@/lib/chat/generation-registry";
import { GenerationBufferWriter } from "@/lib/chat/generation-buffer-writer";
import { createRagChatStream } from "@/lib/chat/rag-chat-stream";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { getChatStore } from "@/lib/chat-store";
import { GENERATION_IN_PROGRESS_CODE } from "@/lib/chat/types";
import { getOpenRouterConfig } from "@/lib/openrouter/config";
import { CHAT_SSE_HEADERS } from "@/lib/openrouter/stream-transform";
import type { ChatApiRequest } from "@/lib/chat/types";

export async function POST(request: Request) {
  let sessionId: string | null = null;
  let lockHeld = false;
  let bufferWriter: GenerationBufferWriter | null = null;

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

    bufferWriter = new GenerationBufferWriter(activeSessionId, {
      userMessageId,
      assistantMessageId,
    }, store);
    await bufferWriter.init();

    const history = await store.getOpenRouterHistory(activeSessionId);

    await store.appendMessage(activeSessionId, {
      id: userMessageId,
      role: "user",
      content,
      createdAt,
    });

    const writer = bufferWriter;

    const onGenerationEnd = async () => {
      try {
        await writer.flushNow();
        const assistantContent = writer.getContent();
        const reasoning = writer.getReasoning();

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
        await writer.clear();
      }
    };

    return new Response(
      createRagChatStream({
        savedPayload: { userMessageId, assistantMessageId },
        history,
        userMessage: content,
        signal: generationController.signal,
        shouldStop: () => store.isGenerationStopRequested(activeSessionId),
        onThinkingDelta: (delta) => {
          writer.appendThinking(delta);
        },
        onContentDelta: (delta) => {
          writer.appendContent(delta);
        },
        onStreamPhase: (phase) => {
          writer.setStreamPhase(phase);
        },
        onGenerationEnd: async () => {
          await onGenerationEnd();
        },
      }),
      { headers: CHAT_SSE_HEADERS },
    );
  } catch (error) {
    if (bufferWriter) {
      await bufferWriter.clear().catch(() => {});
    }
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
