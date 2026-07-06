import { NextResponse, type NextRequest } from "next/server";
import {
  releaseGeneration,
  tryAcquireGeneration,
} from "@/lib/chat/generation-registry";
import { GenerationBufferWriter } from "@/lib/chat/generation-buffer-writer";
import { createRagChatStream } from "@/lib/chat/rag-chat-stream";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { prepareChatStore } from "@/lib/chat-store/api";
import {
  appendUpstashSyncCookieHeader,
  upstashDonePayload,
} from "@/lib/chat-store/upstash-sync.server";
import { isUpstashProvider } from "@/lib/chat-store";
import { mapChatRouteError } from "@/lib/chat/map-route-error";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";
import { attachVercelStreamDeadline } from "@/lib/chat/vercel-runtime";
import { getOpenRouterConfig } from "@/lib/openrouter/config";
import { CHAT_SSE_HEADERS } from "@/lib/openrouter/stream-transform";
import { GENERATION_IN_PROGRESS_CODE, type ChatApiRequest } from "@/lib/chat/types";

/** RAG needs navigator + embeddings + answer stream — above Vercel Hobby's 10s default. */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  let sessionId: string | null = null;
  let lockHeld = false;
  let bufferWriter: GenerationBufferWriter | null = null;
  let clearStreamDeadline: (() => void) | null = null;

  try {
    if (!getOpenRouterConfig()) {
      return NextResponse.json(
        { error: "Chat is not configured", code: CHAT_ERROR_CODES.NOT_CONFIGURED },
        { status: 503 },
      );
    }

    sessionId = await requireSessionId(request);
    const activeSessionId = sessionId;
    const store = await prepareChatStore();

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
        {
          error: GENERATION_IN_PROGRESS_CODE,
          code: CHAT_ERROR_CODES.GENERATION_IN_PROGRESS,
        },
        { status: 409 },
      );
    }

    lockHeld = true;

    bufferWriter = new GenerationBufferWriter(activeSessionId, {
      userMessageId,
      assistantMessageId,
    }, store);
    await bufferWriter.init();

    const { signal: streamSignal, clear: clearDeadline } =
      attachVercelStreamDeadline(generationController.signal);
    clearStreamDeadline = clearDeadline;

    const history = await store.getOpenRouterHistory(activeSessionId);

    await store.appendMessage(activeSessionId, {
      id: userMessageId,
      role: "user",
      content,
      createdAt,
    });

    const writer = bufferWriter;
    let turnSuggestions: string[] = [];

    const persistGenerationEnd = async () => {
      try {
        await writer.flushNow();
        const assistantContent = writer.getContent();
        const reasoning = writer.getReasoning();

        if (assistantContent || reasoning || turnSuggestions.length > 0) {
          await store.appendMessage(activeSessionId, {
            id: assistantMessageId,
            role: "assistant",
            content: assistantContent,
            reasoning: reasoning || undefined,
            suggestions:
              turnSuggestions.length > 0 ? turnSuggestions : undefined,
            createdAt: Date.now(),
          });
        }
      } finally {
        clearStreamDeadline?.();
        await releaseGeneration(activeSessionId);
        lockHeld = false;
        await writer.clear();
      }
    };

    const streamHeaders = new Headers(CHAT_SSE_HEADERS);
    if (isUpstashProvider()) {
      appendUpstashSyncCookieHeader(streamHeaders, request);
    }

    return new Response(
      createRagChatStream({
        savedPayload: { userMessageId, assistantMessageId },
        history,
        userMessage: content,
        signal: streamSignal,
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
        onSuggestionsReady: (items) => {
          turnSuggestions = items;
        },
        onGenerationEnd: async () => {
          await persistGenerationEnd();
          return upstashDonePayload();
        },
      }),
      { headers: streamHeaders },
    );
  } catch (error) {
    clearStreamDeadline?.();
    if (bufferWriter) {
      await bufferWriter.clear().catch(() => {});
    }
    if (sessionId && lockHeld) {
      await releaseGeneration(sessionId);
    }

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
