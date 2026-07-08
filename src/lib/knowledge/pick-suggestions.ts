import { SUGGESTION_BANK, type SuggestionCandidate } from "./suggestion-bank";
import type { RetrievalPlan } from "./retrieval-plan";

export const SUGGESTION_LIMIT_COLD_START = 2;
export const SUGGESTION_LIMIT_FOLLOW_UP = 2;

export type PickSuggestionsMode = "cold_start" | "off_topic" | "fallback";

export type PickSuggestionsInput = {
  mode: PickSuggestionsMode;
  language: "en" | "ch";
  plan?: RetrievalPlan;
  userMessages: string[];
  previousSuggestions?: string[];
  max?: number;
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function localize(candidate: SuggestionCandidate, language: "en" | "ch"): string {
  return candidate.text[language];
}

function messageMatchesCandidateText(
  message: string,
  candidate: SuggestionCandidate,
): boolean {
  const normalized = normalizeText(message);
  if (!normalized) return false;
  const en = normalizeText(candidate.text.en);
  const ch = normalizeText(candidate.text.ch);
  if (normalized.includes(en) || en.includes(normalized)) return true;
  if (normalized.includes(ch) || ch.includes(normalized)) return true;
  const words = en.split(" ").filter((w) => w.length > 4);
  if (words.length >= 2 && words.every((w) => normalized.includes(w))) return true;
  return false;
}

function isBlockedCandidate(
  candidate: SuggestionCandidate,
  userMessages: string[],
  previousSuggestions: string[],
): boolean {
  const blocked = [...userMessages, ...previousSuggestions];
  return blocked.some((text) => messageMatchesCandidateText(text, candidate));
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

function fallbackCandidatesForDoc(docId: string): SuggestionCandidate[] {
  return SUGGESTION_BANK.filter(
    (candidate) => candidate.kind === "fallback" && candidate.docId === docId,
  );
}

function pickFallback(input: PickSuggestionsInput, max: number): string[] {
  const primaryDocId = input.plan?.focus_doc_ids[0];
  if (!primaryDocId) return [];

  const previousSuggestions = input.previousSuggestions ?? [];
  const results: string[] = [];
  const seen = new Set<string>();

  for (const candidate of fallbackCandidatesForDoc(primaryDocId)) {
    if (isBlockedCandidate(candidate, input.userMessages, previousSuggestions)) {
      continue;
    }

    const text = localize(candidate, input.language);
    const key = normalizeText(text);
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(text);
    if (results.length >= max) break;
  }

  return results;
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
