import type { ChatMessage } from "@/lib/chat/types";
import { SUGGESTION_LIMIT_FOLLOW_UP } from "@/lib/knowledge/suggestion-limits";

/** Chips from the latest assistant message only (LLM trailer on the server). */
export function resolveDisplaySuggestions(
  messages: ChatMessage[],
  isLoading: boolean,
): string[] {
  if (isLoading) return [];

  const last = messages.at(-1);
  if (last?.role === "assistant" && last.suggestions?.length) {
    return last.suggestions.slice(0, SUGGESTION_LIMIT_FOLLOW_UP);
  }

  return [];
}
