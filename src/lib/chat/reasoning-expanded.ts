import type { ChatMessage } from "@/lib/chat/types";

/** Pure thinking (no content yet) stays open; otherwise user toggle controls visibility. */
export function isReasoningExpanded(
  message: ChatMessage,
  expandedIds: Set<string>,
): boolean {
  if (!message.reasoning) return false;

  const isThinkingPhase =
    message.status === "streaming" && !message.content;

  if (isThinkingPhase) return true;

  return expandedIds.has(message.id);
}
