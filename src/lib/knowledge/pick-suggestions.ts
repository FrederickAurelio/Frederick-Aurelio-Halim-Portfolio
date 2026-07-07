import { SUGGESTION_BANK, type SuggestionCandidate } from "./suggestion-bank";
import type { RetrievalPlan } from "./retrieval-plan";
import { resolvePrimaryDocId } from "./resolve-doc-id";
import { sectionMatches } from "./section-matches";

export const SUGGESTION_LIMIT_COLD_START = 2;
export const SUGGESTION_LIMIT_FOLLOW_UP = 2;

/** Floor scores by turn type — broad/stack turns stay strict; focused turns allow more chips. */
export const FOLLOW_UP_MIN_FOCUSED = 8;
export const FOLLOW_UP_MIN_BROAD = 9;
export const FOLLOW_UP_MIN_AFTER_STACK = 9;
/** Second chip must meet this score and not cover a retrieved section. */
export const FOLLOW_UP_STRONG_SECOND = 8;
/** Top chip must clear this bar or we show nothing. */
export const SHOW_MIN = 8;

const PROJECT_DOC_IDS = new Set([
  "quizconnect",
  "nextjs-fxtrade",
  "memories",
  "promis-conveyor-chain",
]);

/** User asked about Frederick broadly, not one project. */
const PORTFOLIO_WIDE_USER_PATTERN =
  /\b(tech stack|your stack|what stack|what technologies|technologies do you|primary stack|skill set|your skills|who are you|about you|your background|what do you do|what languages|open to new roles|工作|技术栈|你是谁|背景|技能)\b/i;

/** Personal / location / education — not a project thread. */
const PERSONAL_TOPIC_PATTERN =
  /\b(country|countries|study|studied|studying|school|university|education|background|who are you|languages?|indonesia|china|hangzhou|medan|live in|lived in|abroad|travel|工作或学习|国家|求学|留学)\b/i;

const NON_PROJECT_SUGGESTION_INTENTS = new Set<RetrievalPlan["intent"]>([
  "bio",
  "experience",
  "list_projects",
  "off_topic",
]);

const RECOMMENDATION_ASKED_PATTERN =
  /\b(flagship|best project|biggest|look at first|where to start|what should i look|recommend|most impressive|主打|最好|先看|推荐)\b/i;

/** Narrow feature-level questions — suppress generic overview/stack chips. */
const SPECIFIC_QUESTION_PATTERN =
  /\b(how does|how do|how is|how are|where does|where do|what was the hardest|server-side|real-?time|websocket|deploy|chart|konva|canvas|seo|whatsapp|lead capture|怎么实现|怎么做的|从哪来|最难)\b/i;

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

const GENERIC_SECTION_IDS = new Set(["at-a-glance", "tech-stack", "overview"]);

export type PickSuggestionsInput = {
  mode: "cold_start" | "follow_up";
  language: "en" | "ch";
  plan?: RetrievalPlan;
  retrievedChunkIds?: string[];
  userMessages: string[];
  assistantContext?: string;
  /** Current-turn assistant reply — used to suppress already-covered topics. */
  assistantAnswer?: string;
  max?: number;
};

type RetrievedCoverage = {
  docIds: Set<string>;
  sections: Set<string>;
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseRetrievedCoverage(chunkIds: string[] | undefined): RetrievedCoverage {
  const docIds = new Set<string>();
  const sections = new Set<string>();
  for (const id of chunkIds ?? []) {
    const hash = id.indexOf("#");
    if (hash === -1) continue;
    const docId = id.slice(0, hash);
    const sectionId = id.slice(hash + 1).replace(/-part\d+$/, "");
    if (docId) docIds.add(docId);
    if (sectionId) sections.add(sectionId);
  }
  return { docIds, sections };
}

function sectionSlug(sectionId: string): string {
  return sectionId.replace(/^\d+-/, "").replace(/-/g, " ");
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

function isSpecificEnoughTurn(lastUser: string): boolean {
  return SPECIFIC_QUESTION_PATTERN.test(lastUser);
}

function isPersonalTopicTurn(lastUser: string, plan?: RetrievalPlan): boolean {
  if (PERSONAL_TOPIC_PATTERN.test(lastUser)) return true;
  if (plan?.intent === "bio" || plan?.intent === "experience") return true;
  return false;
}

function defaultFocusForIntent(intent: RetrievalPlan["intent"]): string[] {
  switch (intent) {
    case "bio":
      return ["about-me"];
    case "experience":
      return ["work-experience"];
    case "list_projects":
    case "recommend_project":
      return ["projects-overview"];
    default:
      return [];
  }
}

function getEffectiveFocusDocIds(input: PickSuggestionsInput): string[] {
  const { plan, userMessages } = input;
  const lastUser = userMessages.at(-1) ?? "";

  if (!plan) return [];

  if (isPortfolioWideUserMessage(lastUser)) {
    return [];
  }

  // Personal/bio turns: never borrow project focus from prior thread context.
  if (isPersonalTopicTurn(lastUser, plan)) {
    const fromPlan = plan.focus_doc_ids.filter((id) => !PROJECT_DOC_IDS.has(id));
    if (fromPlan.length > 0) return fromPlan;
    return defaultFocusForIntent(plan.intent);
  }

  if (plan.focus_doc_ids.length > 0) return plan.focus_doc_ids;

  // Only infer from the current user message — not assistant/history context.
  const primary = resolvePrimaryDocId(lastUser, "");
  if (primary) return [primary];

  return defaultFocusForIntent(plan.intent);
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

function userAlreadyAsked(candidate: SuggestionCandidate, userMessages: string[]): boolean {
  return userMessages.some((msg) => messageMatchesCandidateText(msg, candidate));
}

function userQuestionMatchesCandidate(
  lastUser: string,
  candidate: SuggestionCandidate,
): boolean {
  return messageMatchesCandidateText(lastUser, candidate);
}

function userAskedBroadStack(userMessages: string[]): boolean {
  return userMessages.some((msg) =>
    /\b(what'?s your tech stack|your tech stack|primary stack|技术栈)\b/i.test(msg),
  );
}

function sectionMentionedInUserMessages(sectionId: string | undefined, userMessages: string[]): boolean {
  if (!sectionId) return false;
  const joined = normalizeText(userMessages.join(" "));
  const key = sectionSlug(sectionId);
  return joined.includes(normalizeText(key));
}

function sectionRetrievedThisTurn(
  sectionId: string | undefined,
  coverage: RetrievedCoverage,
  candidateDocId?: string,
): boolean {
  if (!sectionId) return false;
  for (const retrieved of coverage.sections) {
    if (sectionMatches(retrieved, sectionId)) return true;
  }
  if (candidateDocId && coverage.docIds.has(candidateDocId)) {
    for (const retrieved of coverage.sections) {
      if (sectionMatches(retrieved, sectionId)) return true;
    }
  }
  return false;
}

function candidateKeywords(candidate: SuggestionCandidate): string[] {
  const text = `${candidate.text.en} ${candidate.text.ch}`;
  const fromText = normalizeText(text)
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((w) => w.length > 3);
  const fromSection = candidate.sectionId
    ? sectionSlug(candidate.sectionId).split(" ").filter((w) => w.length > 3)
    : [];
  return [...new Set([...fromText, ...fromSection])];
}

function topicCoveredInAnswer(
  candidate: SuggestionCandidate,
  assistantAnswer: string | undefined,
): boolean {
  if (!assistantAnswer?.trim()) return false;
  const answer = normalizeText(assistantAnswer);
  const keywords = candidateKeywords(candidate);
  if (keywords.length === 0) return false;

  const en = normalizeText(candidate.text.en);
  const words = en.split(" ").filter((w) => w.length > 3);
  for (let i = 0; i < words.length - 1; i += 1) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (phrase.length >= 8 && answer.includes(phrase)) return true;
  }

  if (candidate.sectionId) {
    const slug = normalizeText(sectionSlug(candidate.sectionId));
    if (slug.length > 3 && answer.includes(slug)) return true;
  }

  const hits = keywords.filter((kw) => answer.includes(kw));
  const threshold = Math.max(2, Math.ceil(keywords.length * 0.35));
  return hits.length >= threshold;
}

function isNarrowAnsweredTurn(input: PickSuggestionsInput): boolean {
  const lastUser = input.userMessages.at(-1) ?? "";
  return isSpecificEnoughTurn(lastUser) && Boolean(input.assistantAnswer?.trim());
}

function isOverviewProjectAsk(lastUser: string): boolean {
  return /\b(tell me about|what is|what does|介绍一下|是什么)\b/i.test(lastUser);
}

function maxChipsForTurn(input: PickSuggestionsInput, max: number): number {
  const lastUser = input.userMessages.at(-1) ?? "";
  const substantiveAnswer = (input.assistantAnswer?.trim().length ?? 0) > 80;
  if (isOverviewProjectAsk(lastUser) && substantiveAnswer) {
    return 1;
  }
  return max;
}

function scoreCandidate(
  candidate: SuggestionCandidate,
  input: PickSuggestionsInput,
  focusDocIds: string[],
  coverage: RetrievedCoverage,
): number {
  const { mode, plan, userMessages, assistantAnswer } = input;

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
  const specificTurn = isSpecificEnoughTurn(lastUser);
  const personalTurn = isPersonalTopicTurn(lastUser, plan);

  if (candidate.intent === "recommend_project" && !wantsRecommendation) {
    return -100;
  }

  if (
    personalTurn &&
    candidate.docId &&
    PROJECT_DOC_IDS.has(candidate.docId)
  ) {
    return -100;
  }

  if (
    NON_PROJECT_SUGGESTION_INTENTS.has(plan.intent) &&
    candidate.docId &&
    PROJECT_DOC_IDS.has(candidate.docId)
  ) {
    return -100;
  }

  if (
    plan.intent === "multi_doc" &&
    candidate.docId &&
    PROJECT_DOC_IDS.has(candidate.docId) &&
    !plan.focus_doc_ids.includes(candidate.docId)
  ) {
    return -100;
  }

  if (userQuestionMatchesCandidate(lastUser, candidate)) {
    return -100;
  }

  if (
    candidate.sectionId &&
    sectionRetrievedThisTurn(candidate.sectionId, coverage, candidate.docId)
  ) {
    return -100;
  }

  if (topicCoveredInAnswer(candidate, assistantAnswer)) {
    return -100;
  }

  if (
    specificTurn &&
    candidate.sectionId &&
    GENERIC_SECTION_IDS.has(candidate.sectionId)
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
  coverage: RetrievedCoverage,
): string[] {
  const plan = input.plan;
  const offTopic = plan?.intent === "off_topic";
  const minScore = minScoreForTurn(input);

  if (isNarrowAnsweredTurn(input)) return [];

  const chipLimit = maxChipsForTurn(input, max);

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

  if (!offTopic && qualified[0].score < SHOW_MIN) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  const push = (entry: ScoredCandidate) => {
    const text = localize(entry.candidate, language);
    if (seen.has(text)) return;
    seen.add(text);
    results.push(text);
  };

  push(qualified[0]);

  if (chipLimit >= 2 && qualified.length > 1) {
    const second = qualified[1];
    const secondRetrieved =
      second.candidate.sectionId &&
      sectionRetrievedThisTurn(
        second.candidate.sectionId,
        coverage,
        second.candidate.docId,
      );
    if (
      second.score >= FOLLOW_UP_STRONG_SECOND &&
      !secondRetrieved &&
      !topicCoveredInAnswer(second.candidate, input.assistantAnswer)
    ) {
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
  const coverage = parseRetrievedCoverage(input.retrievedChunkIds);

  const scored = SUGGESTION_BANK.map((candidate) => ({
    candidate,
    score: scoreCandidate(candidate, input, focusDocIds, coverage),
  }));

  return selectFollowUpChips(scored, input, max, language, coverage);
}
