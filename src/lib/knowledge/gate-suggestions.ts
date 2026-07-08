import { SUGGESTION_BANK, type SuggestionCandidate } from "./suggestion-bank";
import type { RetrievalPlan } from "./retrieval-plan";
import { sectionMatches } from "./section-matches";

const DEFAULT_MAX_CHIPS = 2;

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

const PORTFOLIO_WIDE_USER_PATTERN =
  /\b(tech stack|your stack|what stack|what technologies|technologies do you|primary stack|skill set|your skills|who are you|about you|your background|what do you do|what languages|open to new roles|工作|技术栈|你是谁|背景|技能)\b/i;

const PERSONAL_TOPIC_PATTERN =
  /\b(country|countries|study|studied|studying|school|university|education|background|who are you|languages?|indonesia|china|hangzhou|medan|live in|lived in|abroad|travel|工作或学习|国家|求学|留学)\b/i;

const RECOMMENDATION_ASKED_PATTERN =
  /\b(flagship|best project|biggest|look at first|where to start|what should i look|recommend|most impressive|主打|最好|先看|推荐)\b/i;

const SPECIFIC_QUESTION_PATTERN =
  /\b(how does|how do|how is|how are|where does|where do|what was the hardest|server-side|real-?time|websocket|deploy|chart|konva|canvas|seo|whatsapp|lead capture|怎么实现|怎么做的|从哪来|最难)\b/i;

const GENERIC_SECTION_IDS = new Set(["at-a-glance", "tech-stack", "overview"]);

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

export type SuggestionGatingInput = {
  plan: RetrievalPlan;
  userMessages: string[];
  assistantAnswer?: string;
  retrievedChunkIds?: string[];
  previousSuggestions?: string[];
  language: "en" | "ch";
  max?: number;
};

type RetrievedCoverage = {
  docIds: Set<string>;
  sections: Set<string>;
};

type ScoredEntry = {
  text: string;
  score: number;
  candidate: SuggestionCandidate | null;
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function localize(candidate: SuggestionCandidate, language: "en" | "ch"): string {
  return candidate.text[language];
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

function isPortfolioWideTurn(input: SuggestionGatingInput): boolean {
  const lastUser = input.userMessages.at(-1) ?? "";
  if (isPortfolioWideUserMessage(lastUser)) return true;
  return input.plan.intent === "list_projects";
}

function userWantsRecommendation(input: SuggestionGatingInput): boolean {
  const lastUser = input.userMessages.at(-1) ?? "";
  if (RECOMMENDATION_ASKED_PATTERN.test(lastUser)) return true;
  return (
    input.plan.intent === "recommend_project" ||
    RECOMMENDATION_ASKED_PATTERN.test(input.plan.answer_hint ?? "")
  );
}

function isSpecificEnoughTurn(lastUser: string): boolean {
  return SPECIFIC_QUESTION_PATTERN.test(lastUser);
}

function isPersonalTopicTurn(lastUser: string, plan: RetrievalPlan): boolean {
  if (PERSONAL_TOPIC_PATTERN.test(lastUser)) return true;
  return plan.intent === "bio" || plan.intent === "experience";
}

function userAskedBroadStack(userMessages: string[]): boolean {
  return userMessages.some((msg) =>
    /\b(what'?s your tech stack|your tech stack|primary stack|技术栈)\b/i.test(msg),
  );
}

function isOverviewProjectAsk(lastUser: string): boolean {
  return /\b(tell me about|what is|what does|介绍一下|是什么)\b/i.test(lastUser);
}

export function isNarrowAnsweredTurn(input: SuggestionGatingInput): boolean {
  const lastUser = input.userMessages.at(-1) ?? "";
  return isSpecificEnoughTurn(lastUser) && Boolean(input.assistantAnswer?.trim());
}

/** Focus used for scoring — portfolio-wide asks clear focus so chips stay strict. */
function effectiveFocusDocIds(input: SuggestionGatingInput): string[] {
  const { plan, userMessages } = input;
  const lastUser = userMessages.at(-1) ?? "";

  if (isPortfolioWideUserMessage(lastUser)) {
    return [];
  }

  if (isPersonalTopicTurn(lastUser, plan)) {
    const fromPlan = plan.focus_doc_ids.filter((id) => !PROJECT_DOC_IDS.has(id));
    if (fromPlan.length > 0) return [fromPlan[0]];
    if (plan.intent === "bio") return ["about-me"];
    if (plan.intent === "experience") return ["work-experience"];
    if (plan.intent === "list_projects" || plan.intent === "recommend_project") {
      return ["projects-overview"];
    }
    return [];
  }

  if (plan.focus_doc_ids.length > 0) return [plan.focus_doc_ids[0]];
  return [];
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

function findBankCandidateForText(text: string): SuggestionCandidate | null {
  for (const candidate of SUGGESTION_BANK) {
    if (candidate.kind !== "fallback" && candidate.kind !== "global") continue;
    if (messageMatchesCandidateText(text, candidate)) return candidate;
  }
  return null;
}

function sectionMentionedInUserMessages(
  sectionId: string | undefined,
  userMessages: string[],
): boolean {
  if (!sectionId) return false;
  const joined = normalizeText(userMessages.join(" "));
  const key = sectionSlug(sectionId);
  return joined.includes(normalizeText(key));
}

function sectionRetrievedThisTurn(
  sectionId: string | undefined,
  coverage: RetrievedCoverage,
): boolean {
  if (!sectionId) return false;
  for (const retrieved of coverage.sections) {
    if (sectionMatches(retrieved, sectionId)) return true;
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

function topicCoveredInAnswerText(text: string, assistantAnswer: string | undefined): boolean {
  const candidate = findBankCandidateForText(text);
  if (candidate) return topicCoveredInAnswer(candidate, assistantAnswer);
  if (!assistantAnswer?.trim()) return false;
  const answer = normalizeText(assistantAnswer);
  const suggestion = normalizeText(text);
  if (!suggestion) return false;
  if (answer.includes(suggestion)) return true;
  const words = suggestion.split(/\s+/).filter((w) => w.length > 3);
  if (words.length < 2) return false;
  const hits = words.filter((w) => answer.includes(w));
  return hits.length >= Math.ceil(words.length * 0.7);
}

function maxChipsForTurn(input: SuggestionGatingInput, max: number): number {
  const lastUser = input.userMessages.at(-1) ?? "";
  const substantiveAnswer = (input.assistantAnswer?.trim().length ?? 0) > 80;
  if (isOverviewProjectAsk(lastUser) && substantiveAnswer) {
    return 1;
  }
  return max;
}

function minScoreForTurn(input: SuggestionGatingInput): number {
  if (userAskedBroadStack(input.userMessages)) {
    return FOLLOW_UP_MIN_AFTER_STACK;
  }
  if (isPortfolioWideTurn(input)) {
    return FOLLOW_UP_MIN_BROAD;
  }
  return FOLLOW_UP_MIN_FOCUSED;
}

function scoreCandidate(
  candidate: SuggestionCandidate,
  input: SuggestionGatingInput,
  focusDocIds: string[],
  coverage: RetrievedCoverage,
): number {
  const { plan, userMessages, assistantAnswer } = input;
  const lastUser = userMessages.at(-1) ?? "";
  const portfolioWide = isPortfolioWideTurn(input);
  const focusSet = new Set(focusDocIds);
  const wantsRecommendation = userWantsRecommendation(input);
  const specificTurn = isSpecificEnoughTurn(lastUser);
  const personalTurn = isPersonalTopicTurn(lastUser, plan);

  if (candidate.intent === "recommend_project" && !wantsRecommendation) {
    return -100;
  }

  if (personalTurn && candidate.docId && PROJECT_DOC_IDS.has(candidate.docId)) {
    return -100;
  }

  if (
    (plan.intent === "bio" ||
      plan.intent === "experience" ||
      plan.intent === "list_projects" ||
      plan.intent === "off_topic") &&
    candidate.docId &&
    PROJECT_DOC_IDS.has(candidate.docId)
  ) {
    return -100;
  }

  if (messageMatchesCandidateText(lastUser, candidate)) {
    return -100;
  }

  if (
    candidate.sectionId &&
    sectionRetrievedThisTurn(candidate.sectionId, coverage)
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
    if (candidate.kind === "fallback" && candidate.docId && PROJECT_DOC_IDS.has(candidate.docId)) {
      if (!candidate.sectionId || !SHALLOW_SECTION_IDS.has(candidate.sectionId)) {
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

  if (focusSet.size > 0 && candidate.docId && !focusSet.has(candidate.docId)) {
    return -100;
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

  if (plan.intent === "list_projects" && candidate.docId === "projects-overview") {
    score += 2;
  }

  if (userMessages.some((msg) => messageMatchesCandidateText(msg, candidate))) {
    score -= 10;
  }

  if ((input.previousSuggestions ?? []).some((msg) => messageMatchesCandidateText(msg, candidate))) {
    score -= 10;
  }

  return score;
}

function scoreFreeformText(
  text: string,
  input: SuggestionGatingInput,
  focusDocIds: string[],
): number {
  if (!focusDocIds[0]) return 7;

  const candidate = findBankCandidateForText(text);
  if (candidate) {
    return scoreCandidate(
      candidate,
      input,
      focusDocIds,
      parseRetrievedCoverage(input.retrievedChunkIds),
    );
  }

  if (topicCoveredInAnswerText(text, input.assistantAnswer)) {
    return -100;
  }

  // Modest default for novel LLM chips on focused turns; portfolio-wide min stays stricter.
  return isPortfolioWideTurn(input) ? 7 : 8;
}

function selectScoredChips(
  scored: ScoredEntry[],
  input: SuggestionGatingInput,
  coverage: RetrievedCoverage,
): string[] {
  const max = input.max ?? DEFAULT_MAX_CHIPS;
  const minScore = minScoreForTurn(input);
  const chipLimit = maxChipsForTurn(input, max);

  const qualified = scored
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.text.localeCompare(b.text);
    });

  if (qualified.length === 0) return [];
  if (qualified[0].score < SHOW_MIN) return [];

  const results: string[] = [];
  const seen = new Set<string>();

  const push = (entry: ScoredEntry) => {
    const key = normalizeText(entry.text);
    if (seen.has(key)) return;
    seen.add(key);
    results.push(entry.text);
  };

  push(qualified[0]);

  if (chipLimit >= 2 && qualified.length > 1) {
    const second = qualified[1];
    const secondRetrieved =
      second.candidate?.sectionId &&
      sectionRetrievedThisTurn(second.candidate.sectionId, coverage);
    if (
      second.score >= FOLLOW_UP_STRONG_SECOND &&
      !secondRetrieved &&
      !topicCoveredInAnswerText(second.text, input.assistantAnswer)
    ) {
      push(second);
    }
  }

  return results;
}

/** Score-gate trailer chips after basic validation — may return fewer than max or []. */
export function gateFollowUpSuggestions(
  items: string[],
  input: SuggestionGatingInput,
): string[] {
  if (isNarrowAnsweredTurn(input)) return [];

  const focusDocIds = effectiveFocusDocIds(input);
  const coverage = parseRetrievedCoverage(input.retrievedChunkIds);

  const scored: ScoredEntry[] = items.map((text) => {
    const candidate = findBankCandidateForText(text);
    const score = candidate
      ? scoreCandidate(candidate, input, focusDocIds, coverage)
      : scoreFreeformText(text, input, focusDocIds);
    return { text, score, candidate };
  });

  return selectScoredChips(scored, input, coverage);
}

/** Score-gate fallback bank chips for the primary focus doc. */
export function pickScoredFallbackChips(input: SuggestionGatingInput): string[] {
  if (isNarrowAnsweredTurn(input)) return [];

  const primaryDocId = input.plan.focus_doc_ids[0];
  if (!primaryDocId) return [];

  const focusDocIds = effectiveFocusDocIds(input);
  const coverage = parseRetrievedCoverage(input.retrievedChunkIds);

  const candidates = SUGGESTION_BANK.filter(
    (candidate) => candidate.kind === "fallback" && candidate.docId === primaryDocId,
  );

  const scored: ScoredEntry[] = candidates.map((candidate) => ({
    text: localize(candidate, input.language),
    score: scoreCandidate(candidate, input, focusDocIds, coverage),
    candidate,
  }));

  return selectScoredChips(scored, input, coverage);
}
