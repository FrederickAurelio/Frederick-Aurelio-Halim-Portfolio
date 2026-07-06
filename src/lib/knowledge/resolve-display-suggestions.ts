import type { ChatMessage } from "@/lib/chat/types";
import type { OpenRouterMessage } from "@/lib/openrouter/types";
import { detectReplyLanguage } from "@/lib/knowledge/refusal";
import { fallbackRetrievalPlan } from "@/lib/knowledge/navigator-fallback";
import {
  pickSuggestions,
  SUGGESTION_LIMIT_FOLLOW_UP,
} from "@/lib/knowledge/pick-suggestions";

function messagesToOpenRouterHistory(messages: ChatMessage[]): OpenRouterMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

function lastUserMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
}

function pickSuggestionsFallbackFromHistory(messages: ChatMessage[]): string[] {
  const lastUser = lastUserMessage(messages);
  const language = lastUser ? detectReplyLanguage(lastUser) : "en";
  const history = messagesToOpenRouterHistory(messages);
  const plan = fallbackRetrievalPlan(history, lastUser);
  const assistantContext =
    [...messages].reverse().find((m) => m.role === "assistant")?.content ?? "";
  return pickSuggestions({
    mode: "follow_up",
    language,
    plan,
    userMessages: messages.filter((m) => m.role === "user").map((m) => m.content),
    assistantContext,
    max: SUGGESTION_LIMIT_FOLLOW_UP,
  });
}

/**
 * Derive chip labels for display. Unclicked chips never enter LLM history.
 * Cold start uses UI language; follow-ups use last user message language.
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

  if (last?.role === "assistant") {
    return pickSuggestionsFallbackFromHistory(messages);
  }

  return [];
}

export { pickSuggestionsFallbackFromHistory };
