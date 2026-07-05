import type { ChatStore } from "@/lib/chat-store";
import type { PaginatedMessages } from "@/lib/chat/types";

/** Prepend in-flight assistant from generation buffer on the latest page only. */
export async function injectGeneratingAssistant(
  sessionId: string,
  store: ChatStore,
  result: PaginatedMessages,
  isLatestPage: boolean,
): Promise<PaginatedMessages> {
  if (!isLatestPage) return result;

  const locked = await store.isGenerationLocked(sessionId);
  if (!locked) return result;

  const buffer = await store.getGenerationBuffer(sessionId);
  if (!buffer) return result;

  if (result.messages.some((message) => message.id === buffer.assistantMessageId)) {
    return result;
  }

  const generatingMessage = {
    id: buffer.assistantMessageId,
    role: "assistant" as const,
    content: buffer.content,
    reasoning: buffer.reasoning || undefined,
    createdAt: buffer.updatedAt,
    status: "generating" as const,
  };

  return {
    ...result,
    messages: [generatingMessage, ...result.messages],
  };
}
