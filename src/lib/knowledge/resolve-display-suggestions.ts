import type { ChatMessage } from "@/lib/chat/types";
import {
  pickSuggestions,
  SUGGESTION_LIMIT_FOLLOW_UP,
} from "@/lib/knowledge/pick-suggestions";

/**
 * Derive chip labels for display. Unclicked chips never enter LLM history.
 * Cold start uses UI language; follow-ups use stored assistant suggestions only.
 */
export function resolveDisplaySuggestions(
  messages: ChatMessage[],
  uiLanguage: "en" | "ch",
  isLoading: boolean,
): string[] {
  if (isLoading) return [];

  const last = messages.at(-1);

  if (last?.role === "assistant" && last.suggestions?.length) {
    return last.suggestions.slice(0, SUGGESTION_LIMIT_FOLLOW_UP);
  }

  if (messages.length === 0) {
    return pickSuggestions({
      mode: "cold_start",
      language: uiLanguage,
      userMessages: [],
    });
  }

  return [];
}
