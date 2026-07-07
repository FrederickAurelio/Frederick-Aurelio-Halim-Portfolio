import type { ChatMessage } from "@/lib/chat/types";
import type { OpenRouterMessage } from "@/lib/openrouter/types";
import { detectReplyLanguage } from "@/lib/knowledge/refusal";
import { fallbackRetrievalPlan } from "@/lib/knowledge/navigator-fallback";
import {
  pickSuggestions,
  SUGGESTION_LIMIT_FOLLOW_UP,
} from "@/lib/knowledge/pick-suggestions";
import {
  applySessionRoutingToPlan,
  computeNextRoutingState,
  EMPTY_SESSION_ROUTING_STATE,
} from "@/lib/knowledge/session-routing-state";
import type { RetrievalPlan } from "@/lib/knowledge/retrieval-plan";

function messagesToOpenRouterHistory(messages: ChatMessage[]): OpenRouterMessage[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

function lastUserMessage(messages: ChatMessage[]): string {
  return [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
}

/** Replay fallback + sticky session routing for each user turn (no LLM). */
function replayLastUserPlan(messages: ChatMessage[]): RetrievalPlan {
  const history: OpenRouterMessage[] = [];
  let state = EMPTY_SESSION_ROUTING_STATE;
  let lastPlan = fallbackRetrievalPlan([], "");

  for (const message of messages) {
    if (message.role === "user") {
      let plan = fallbackRetrievalPlan(history, message.content);
      plan = applySessionRoutingToPlan(plan, message.content, state);
      lastPlan = plan;
      state = computeNextRoutingState(state, plan, message.content);
    }
    if (message.role === "user" || message.role === "assistant") {
      history.push({
        role: message.role as "user" | "assistant",
        content: message.content,
      });
    }
  }

  return lastPlan;
}

function pickSuggestionsFallbackFromHistory(messages: ChatMessage[]): string[] {
  const lastUser = lastUserMessage(messages);
  const language = lastUser ? detectReplyLanguage(lastUser) : "en";
  const plan = replayLastUserPlan(messages);
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

export { pickSuggestionsFallbackFromHistory, replayLastUserPlan };
