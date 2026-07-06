import { SUGGESTION_BANK, type SuggestionCandidate } from "./suggestion-bank";
import type { RetrievalPlan } from "./retrieval-plan";
import { resolvePrimaryDocId } from "./resolve-doc-id";
import { sectionMatches } from "./section-matches";

export const SUGGESTION_LIMIT_COLD_START = 3;
export const SUGGESTION_LIMIT_FOLLOW_UP = 2;

export type PickSuggestionsInput = {
  mode: "cold_start" | "follow_up";
  language: "en" | "ch";
  plan?: RetrievalPlan;
  retrievedChunkIds?: string[];
  userMessages: string[];
  /** Last assistant reply — used to infer project focus on generic follow-ups. */
  assistantContext?: string;
  max?: number;
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function getEffectiveFocusDocIds(input: PickSuggestionsInput): string[] {
  const { plan, userMessages, assistantContext } = input;
  if (plan?.focus_doc_ids.length) return plan.focus_doc_ids;

  const lastUser = userMessages.at(-1) ?? "";
  const priorUsers = userMessages.slice(0, -1).join("\n");
  const context = [priorUsers, assistantContext].filter(Boolean).join("\n");

  const primary = resolvePrimaryDocId(lastUser, context);
  if (primary) return [primary];

  return [];
}

function userAlreadyAsked(candidate: SuggestionCandidate, userMessages: string[]): boolean {
  const en = normalizeText(candidate.text.en);
  const ch = normalizeText(candidate.text.ch);
  return userMessages.some((msg) => {
    const normalized = normalizeText(msg);
    if (!normalized) return false;
    if (normalized.includes(en) || en.includes(normalized)) return true;
    if (normalized.includes(ch) || ch.includes(normalized)) return true;
    const words = en.split(" ").filter((w) => w.length > 4);
    if (words.length >= 2 && words.every((w) => normalized.includes(w))) return true;
    return false;
  });
}

function sectionMentionedInUserMessages(sectionId: string | undefined, userMessages: string[]): boolean {
  if (!sectionId) return false;
  const joined = normalizeText(userMessages.join(" "));
  const key = sectionId.replace(/^\d+-/, "").replace(/-/g, " ");
  return joined.includes(normalizeText(key));
}

function scoreCandidate(
  candidate: SuggestionCandidate,
  input: PickSuggestionsInput,
  focusDocIds: string[],
): number {
  const { mode, plan, userMessages } = input;

  if (mode === "cold_start") {
    if (candidate.kind !== "cold_start") return -100;
    return 0;
  }

  if (!plan) return -100;

  if (plan.intent === "off_topic") {
    if (candidate.kind !== "global") return -100;
    return 3;
  }

  if (candidate.kind === "cold_start") return -100;

  const focusSet = new Set(focusDocIds);

  if (focusSet.size > 0) {
    if (
      candidate.kind === "follow_up" &&
      candidate.docId &&
      !focusSet.has(candidate.docId)
    ) {
      return -100;
    }
    if (
      candidate.kind === "pivot" &&
      (plan.intent === "project_detail" || plan.intent === "follow_up")
    ) {
      return -100;
    }
  }

  let score = 0;

  if (candidate.docId && focusSet.has(candidate.docId)) {
    score += 5;
  }

  if (candidate.intent && candidate.intent === plan.intent) {
    score += 2;
  }

  if (candidate.sectionId) {
    const inPlan = plan.include_sections.some((s) =>
      sectionMatches(s, candidate.sectionId!),
    );
    if (inPlan) score -= 3;
    else if (!sectionMentionedInUserMessages(candidate.sectionId, userMessages)) {
      score += 3;
      if (
        candidate.sectionId === "data-sources" ||
        candidate.sectionId === "7-interesting-hard-problems-solved"
      ) {
        score += 1;
      }
    }
  }

  if (candidate.kind === "pivot") {
    if (plan.intent === "project_detail" || plan.intent === "follow_up") {
      score += 2;
    }
    if (candidate.docId && plan.exclude_doc_ids.includes(candidate.docId)) {
      score -= 10;
    }
    if (candidate.docId && focusSet.has(candidate.docId)) {
      score -= 5;
    }
  }

  if (plan.intent === "list_projects") {
    if (candidate.docId === "projects-overview") score += 2;
    if (candidate.kind === "pivot") score += 1;
  }

  if (userAlreadyAsked(candidate, userMessages)) {
    score -= 10;
  }

  if (candidate.kind === "follow_up" && !candidate.docId) {
    score += 1;
  }

  if (candidate.kind === "global") {
    score -= 5;
  }

  return score;
}

function localize(candidate: SuggestionCandidate, language: "en" | "ch"): string {
  return candidate.text[language];
}

export function pickSuggestions(input: PickSuggestionsInput): string[] {
  const max =
    input.max ??
    (input.mode === "cold_start"
      ? SUGGESTION_LIMIT_COLD_START
      : SUGGESTION_LIMIT_FOLLOW_UP);
  const language = input.language;

  if (input.mode === "cold_start") {
    const priority = [
      "cold-start-project",
      "cold-stack",
      "cold-who",
      "cold-quizconnect",
    ];
    return SUGGESTION_BANK.filter((c) => c.kind === "cold_start")
      .sort(
        (a, b) => priority.indexOf(a.id) - priority.indexOf(b.id),
      )
      .slice(0, max)
      .map((c) => localize(c, language));
  }

  const focusDocIds = getEffectiveFocusDocIds(input);

  const scored = SUGGESTION_BANK.map((candidate) => ({
    candidate,
    score: scoreCandidate(candidate, input, focusDocIds),
  }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.id.localeCompare(b.candidate.id);
    });

  const seen = new Set<string>();
  const results: string[] = [];

  for (const { candidate } of scored) {
    const text = localize(candidate, language);
    if (seen.has(text)) continue;
    seen.add(text);
    results.push(text);
    if (results.length >= max) break;
  }

  return results;
}
