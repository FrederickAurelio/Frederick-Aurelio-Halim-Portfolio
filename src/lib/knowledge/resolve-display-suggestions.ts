import type { ChatMessage } from "@/lib/chat/types";
import { SUGGESTION_LIMIT_FOLLOW_UP } from "@/lib/knowledge/suggestion-limits";

/** Follow-up chips from the last assistant message, or cold-start chips when the chat is empty. */
export function resolveDisplaySuggestions(
  messages: ChatMessage[],
  isLoading: boolean,
  initialSuggestions: string[] = [],
): string[] {
  if (isLoading) return [];

  const last = messages.at(-1);
  if (last?.role === "assistant" && last.suggestions?.length) {
    return last.suggestions.slice(0, SUGGESTION_LIMIT_FOLLOW_UP);
  }

  if (messages.length === 0 && initialSuggestions.length > 0) {
    return initialSuggestions.slice(0, SUGGESTION_LIMIT_FOLLOW_UP);
  }

  return [];
}
