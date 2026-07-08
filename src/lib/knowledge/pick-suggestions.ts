import { SUGGESTION_BANK, type SuggestionCandidate } from "./suggestion-bank";
import type { RetrievalPlan } from "./retrieval-plan";
import { pickScoredFallbackChips } from "./gate-suggestions";

export const SUGGESTION_LIMIT_COLD_START = 2;
export const SUGGESTION_LIMIT_FOLLOW_UP = 2;

export type PickSuggestionsMode = "cold_start" | "off_topic" | "fallback";

export type PickSuggestionsInput = {
  mode: PickSuggestionsMode;
  language: "en" | "ch";
  plan?: RetrievalPlan;
  userMessages: string[];
  previousSuggestions?: string[];
  assistantAnswer?: string;
  retrievedChunkIds?: string[];
  max?: number;
};

function localize(candidate: SuggestionCandidate, language: "en" | "ch"): string {
  return candidate.text[language];
}

function pickColdStart(language: "en" | "ch", max: number): string[] {
  const priority = [
    "cold-start-project",
    "cold-stack",
    "cold-who",
    "cold-quizconnect",
  ];

  return SUGGESTION_BANK.filter((candidate) => candidate.kind === "cold_start")
    .sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id))
    .slice(0, max)
    .map((candidate) => localize(candidate, language));
}

function pickOffTopic(language: "en" | "ch", max: number): string[] {
  return SUGGESTION_BANK.filter((candidate) => candidate.kind === "global")
    .slice(0, max)
    .map((candidate) => localize(candidate, language));
}

function pickFallback(input: PickSuggestionsInput, max: number): string[] {
  if (!input.plan) return [];

  return pickScoredFallbackChips({
    plan: input.plan,
    userMessages: input.userMessages,
    assistantAnswer: input.assistantAnswer,
    retrievedChunkIds: input.retrievedChunkIds,
    previousSuggestions: input.previousSuggestions,
    language: input.language,
    max,
  });
}

export function pickSuggestions(input: PickSuggestionsInput): string[] {
  const max =
    input.max ??
    (input.mode === "cold_start"
      ? SUGGESTION_LIMIT_COLD_START
      : SUGGESTION_LIMIT_FOLLOW_UP);

  switch (input.mode) {
    case "cold_start":
      return pickColdStart(input.language, max);
    case "off_topic":
      return pickOffTopic(input.language, max);
    case "fallback":
      return pickFallback(input, max);
    default:
      return [];
  }
}
