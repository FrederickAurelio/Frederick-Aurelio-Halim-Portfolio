import type { ChatMessage, StoredChatMessage } from "@/lib/chat/types";

export function storedToUiMessage(message: StoredChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    reasoning: message.reasoning,
    reasoningExpanded: false,
    streamPhase: message.streamPhase,
    status: message.status === "generating" ? "streaming" : "complete",
    createdAt: message.createdAt,
    suggestions: message.suggestions,
  };
}

export function mergeMessagesById(
  pages: StoredChatMessage[][],
  optimistic: ChatMessage[],
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();

  for (const page of pages) {
    for (const message of page) {
      map.set(message.id, storedToUiMessage(message));
    }
  }

  for (const message of optimistic) {
    map.set(message.id, message);
  }

  return [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
}
