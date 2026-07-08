import { NextResponse, type NextRequest } from "next/server";
import {
  releaseGeneration,
  tryAcquireGeneration,
} from "@/lib/chat/generation-registry";
import { GenerationBufferWriter } from "@/lib/chat/generation-buffer-writer";
import { createRagChatStream } from "@/lib/chat/rag-chat-stream";
import { SessionError, requireSessionId } from "@/lib/chat/session";
import { prepareChatStore } from "@/lib/chat-store/api";
import { upstashDonePayload } from "@/lib/chat-store/upstash-sync.server";
import { mapChatRouteError } from "@/lib/chat/map-route-error";
import { CHAT_ERROR_CODES } from "@/lib/chat/api-errors";
import { attachVercelStreamDeadline } from "@/lib/chat/vercel-runtime";
import { createChatSseResponse } from "@/lib/chat/create-chat-sse-response";
import { getOpenRouterConfig } from "@/lib/openrouter/config";
import { GENERATION_IN_PROGRESS_CODE, type ChatApiRequest } from "@/lib/chat/types";

/** RAG needs navigator + embeddings + answer stream — above Vercel Hobby's 10s default. */
export const maxDuration = 180;

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
    const routingState = await store.getSessionRoutingState(activeSessionId);

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
        writer.scheduleDeferredClear();
      }
    };

    return createChatSseResponse(
      createRagChatStream({
        savedPayload: { userMessageId, assistantMessageId },
        history,
        userMessage: content,
        routingState,
        signal: streamSignal,
        shouldStop: () => store.isGenerationStopRequested(activeSessionId),
        onRoutingStateReady: (next) =>
          store.setSessionRoutingState(activeSessionId, next),
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
          void writer.setSuggestions(items);
        },
        onGenerationEnd: async () => {
          await persistGenerationEnd();
          return upstashDonePayload();
        },
      }),
      request,
    );
  } catch (error) {
    clearStreamDeadline?.();
    if (bufferWriter) {
      bufferWriter.scheduleDeferredClear();
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
