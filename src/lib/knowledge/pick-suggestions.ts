import { SUGGESTION_BANK, type SuggestionCandidate } from "./suggestion-bank";
import type { RetrievalPlan } from "./retrieval-plan";
import { resolvePrimaryDocId } from "./resolve-doc-id";
import { sectionMatches } from "./section-matches";

export const SUGGESTION_LIMIT_COLD_START = 3;
export const SUGGESTION_LIMIT_FOLLOW_UP = 2;

/** Floor scores by turn type — broad/stack turns stay strict; focused turns allow more chips. */
export const FOLLOW_UP_MIN_FOCUSED = 6;
export const FOLLOW_UP_MIN_BROAD = 7;
export const FOLLOW_UP_MIN_AFTER_STACK = 9;
/** Second chip needs this score, or must be within FOLLOW_UP_SECOND_GAP of the top. */
export const FOLLOW_UP_STRONG_SECOND = 8;
export const FOLLOW_UP_SECOND_GAP = 2;

const PROJECT_DOC_IDS = new Set([
  "quizconnect",
  "nextjs-fxtrade",
  "memories",
  "promis-conveyor-chain",
]);

/** User asked about Frederick broadly, not one project. */
const PORTFOLIO_WIDE_USER_PATTERN =
  /\b(tech stack|your stack|what stack|what technologies|technologies do you|primary stack|skill set|your skills|who are you|about you|your background|what do you do|what languages|open to new roles|工作|技术栈|你是谁|背景|技能)\b/i;

const RECOMMENDATION_ASKED_PATTERN =
  /\b(flagship|best project|biggest|look at first|where to start|what should i look|recommend|most impressive|主打|最好|先看|推荐)\b/i;

/** Sections OK on a broad turn — not deep implementation dives. */
const SHALLOW_SECTION_IDS = new Set([
  "overview",
  "where-to-start",
  "at-a-glance",
  "background",
  "education",
  "languages",
  "interests",
  "contact",
  "mufy-at-a-glance",
  "mufy-product",
  "other-projects-github",
]);

export type PickSuggestionsInput = {
  mode: "cold_start" | "follow_up";
  language: "en" | "ch";
  plan?: RetrievalPlan;
  retrievedChunkIds?: string[];
  userMessages: string[];
  assistantContext?: string;
  max?: number;
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isPortfolioWideUserMessage(message: string): boolean {
  return PORTFOLIO_WIDE_USER_PATTERN.test(message);
}

function isPortfolioWideTurn(input: PickSuggestionsInput): boolean {
  const lastUser = input.userMessages.at(-1) ?? "";
  if (isPortfolioWideUserMessage(lastUser)) return true;

  const plan = input.plan;
  if (!plan) return false;
  if (plan.intent === "list_projects") return true;

  return false;
}

function userWantsRecommendation(input: PickSuggestionsInput): boolean {
  const lastUser = input.userMessages.at(-1) ?? "";
  if (RECOMMENDATION_ASKED_PATTERN.test(lastUser)) return true;
  const plan = input.plan;
  return (
    plan?.intent === "recommend_project" ||
    RECOMMENDATION_ASKED_PATTERN.test(plan?.answer_hint ?? "")
  );
}

function getEffectiveFocusDocIds(input: PickSuggestionsInput): string[] {
  const { plan, userMessages, assistantContext } = input;
  const lastUser = userMessages.at(-1) ?? "";

  if (isPortfolioWideUserMessage(lastUser)) {
    return [];
  }

  if (plan?.focus_doc_ids.length) return plan.focus_doc_ids;

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

function userAskedBroadStack(userMessages: string[]): boolean {
  return userMessages.some((msg) =>
    /\b(what'?s your tech stack|your tech stack|primary stack|技术栈)\b/i.test(msg),
  );
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

  const lastUser = userMessages.at(-1) ?? "";
  const portfolioWide = isPortfolioWideTurn(input);
  const focusSet = new Set(focusDocIds);
  const wantsRecommendation = userWantsRecommendation(input);

  if (
    candidate.intent === "recommend_project" &&
    !wantsRecommendation
  ) {
    return -100;
  }

  if (portfolioWide) {
    if (
      candidate.kind === "follow_up" &&
      candidate.docId &&
      PROJECT_DOC_IDS.has(candidate.docId)
    ) {
      if (
        !candidate.sectionId ||
        !SHALLOW_SECTION_IDS.has(candidate.sectionId)
      ) {
        return -100;
      }
    }
    if (
      userAskedBroadStack(userMessages) &&
      candidate.sectionId === "tech-stack" &&
      candidate.docId
    ) {
      return -100;
    }
  }

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

  if (
    portfolioWide &&
    candidate.docId === "about-me" &&
    isPortfolioWideUserMessage(lastUser)
  ) {
    score += 3;
  }

  if (candidate.sectionId) {
    const inPlan = plan.include_sections.some((s) =>
      sectionMatches(s, candidate.sectionId!),
    );
    if (inPlan) score -= 3;
    else if (!sectionMentionedInUserMessages(candidate.sectionId, userMessages)) {
      score += 3;
      if (
        !portfolioWide &&
        focusSet.size > 0 &&
        (candidate.sectionId === "data-sources" ||
          candidate.sectionId === "7-interesting-hard-problems-solved")
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
  }

  if (userAlreadyAsked(candidate, userMessages)) {
    score -= 10;
  }

  if (candidate.kind === "global") {
    score -= 5;
  }

  return score;
}

function localize(candidate: SuggestionCandidate, language: "en" | "ch"): string {
  return candidate.text[language];
}

function minScoreForTurn(input: PickSuggestionsInput): number {
  if (userAskedBroadStack(input.userMessages)) {
    return FOLLOW_UP_MIN_AFTER_STACK;
  }
  if (isPortfolioWideTurn(input)) {
    return FOLLOW_UP_MIN_BROAD;
  }
  return FOLLOW_UP_MIN_FOCUSED;
}

type ScoredCandidate = { candidate: SuggestionCandidate; score: number };

function selectFollowUpChips(
  scored: ScoredCandidate[],
  input: PickSuggestionsInput,
  max: number,
  language: "en" | "ch",
): string[] {
  const plan = input.plan;
  const offTopic = plan?.intent === "off_topic";
  const minScore = minScoreForTurn(input);

  const qualified = scored
    .filter(({ candidate, score }) => {
      if (offTopic && candidate.kind === "global") return score > 0;
      return score >= minScore;
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.id.localeCompare(b.candidate.id);
    });

  if (qualified.length === 0) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  const push = (entry: ScoredCandidate) => {
    const text = localize(entry.candidate, language);
    if (seen.has(text)) return;
    seen.add(text);
    results.push(text);
  };

  push(qualified[0]);

  if (max >= 2 && qualified.length > 1) {
    const top = qualified[0].score;
    const second = qualified[1];
    const competitive =
      second.score >= FOLLOW_UP_STRONG_SECOND ||
      top - second.score <= FOLLOW_UP_SECOND_GAP;
    if (competitive) {
      push(second);
    }
  }

  return results;
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
  }));

  return selectFollowUpChips(scored, input, max, language);
}
