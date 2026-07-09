import { loadKnowledgeMap } from "./load-knowledge-map";
import { findDocIdsInText, resolvePrimaryDocId } from "./resolve-doc-id";
import type { RetrievalPlan } from "./retrieval-plan";

export type SessionRoutingState = {
  primaryDocId: string | null;
  updatedAt: number;
};

export const EMPTY_SESSION_ROUTING_STATE: SessionRoutingState = {
  primaryDocId: null,
  updatedAt: 0,
};

const CASUAL_NOISE_PATTERN =
  /^(hai|hi|hey|yo|lol|lmao|haha|ok|okay|nice|cool|thanks|thx|ty|wow|emm+|uh+|ah+|oh+|yo+|666|👍|😂|🤣|哈+|嗯+|啊+)[\s!.?~]*$/iu;

const RESUME_TOPIC_PATTERN =
  /\b(back to (the )?main topic|back to that|as i was saying|anyway|where were we|回到正题|刚才那个|继续讲|继续说)\b/i;

const VAGUE_ASPECT_PATTERN =
  /\b(stack|tech stack|technology|framework|libraries|auth|authentication|deploy|deployment|architecture|how does|how do you|tell me more|what about|用什么|技术栈|怎么实现|架构|部署)\b/i;

const PERSONAL_TOPIC_PATTERN =
  /\b(country|countries|study|studied|studying|school|university|education|background|who are you|languages?|indonesia|china|hangzhou|medan|live in|lived in|abroad|travel|工作或学习|国家|求学|留学)\b/i;

const PORTFOLIO_KEYWORD_PATTERN =
  /\b(project|stack|frederick|quiz|fx|memories|mufy|portfolio|work|job|skill|demo|github|经验|项目)\b|[\u4e00-\u9fff]/i;

export function isPersonalTopicMessage(message: string): boolean {
  return PERSONAL_TOPIC_PATTERN.test(message.trim());
}

export function isCasualNoise(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (CASUAL_NOISE_PATTERN.test(trimmed)) return true;
  if (trimmed.length < 12 && !PORTFOLIO_KEYWORD_PATTERN.test(trimmed)) return true;
  return false;
}

export function isResumeTopicPhrase(message: string): boolean {
  return RESUME_TOPIC_PATTERN.test(message.trim());
}

export function isVagueFollowUp(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed || isCasualNoise(trimmed)) return false;
  if (resolvePrimaryDocId(trimmed, "")) return false;
  if (findDocIdsInText(trimmed).length >= 2) return false;
  if (isResumeTopicPhrase(trimmed)) return true;
  return VAGUE_ASPECT_PATTERN.test(trimmed);
}

export function formatSessionTopicForPrompt(state: SessionRoutingState): string {
  const doc = state.primaryDocId ?? "none";
  return `<session_topic>
  primaryDocId: ${doc}
  note: Vague follow-ups ("what stack?", "how does auth work?", "back to main topic") refer to primaryDocId unless the user names a different project or topic.
  When primaryDocId is set and the user asks a vague follow-up without naming another doc, put that doc in preferDocId / prefer_doc_ids and write search queries about it.
  If the user names 2+ topics in one message, emit one topics[] entry per area — do not mash them into a single query.
</session_topic>`;
}

export function docTitleForId(docId: string): string | undefined {
  return loadKnowledgeMap().sources.find((source) => source.docId === docId)
    ?.title;
}

export function computeNextRoutingState(
  previous: SessionRoutingState,
  plan: RetrievalPlan,
  currentMessage: string,
): SessionRoutingState {
  const now = Date.now();
  const message = currentMessage.trim();

  if (isCasualNoise(message) || plan.off_topic) {
    return {
      ...previous,
      updatedAt: now,
    };
  }

  if (plan.exclude_doc_ids.length > 0 && plan.prefer_doc_ids.length === 0) {
    const excluded = new Set(plan.exclude_doc_ids);
    if (previous.primaryDocId && excluded.has(previous.primaryDocId)) {
      return { primaryDocId: null, updatedAt: now };
    }
  }

  const explicit = resolvePrimaryDocId(message, "");
  if (explicit) {
    return { primaryDocId: explicit, updatedAt: now };
  }

  if (isPersonalTopicMessage(message) && !explicit) {
    const fromPlan =
      plan.prefer_doc_ids[0] ??
      plan.topics.find((topic) => topic.preferDocId)?.preferDocId ??
      "about-me";
    return { primaryDocId: fromPlan, updatedAt: now };
  }

  const fromPrefer = plan.prefer_doc_ids[0];
  if (fromPrefer) {
    return { primaryDocId: fromPrefer, updatedAt: now };
  }

  const fromTopic = plan.topics.find((topic) => topic.preferDocId)?.preferDocId;
  if (fromTopic) {
    return { primaryDocId: fromTopic, updatedAt: now };
  }

  return {
    ...previous,
    updatedAt: now,
  };
}

export function parseSessionRoutingState(raw: unknown): SessionRoutingState {
  if (!raw || typeof raw !== "object") return { ...EMPTY_SESSION_ROUTING_STATE };

  const obj = raw as Record<string, unknown>;
  const primaryDocId =
    typeof obj.primaryDocId === "string" && obj.primaryDocId.trim()
      ? obj.primaryDocId.trim()
      : null;
  const updatedAt =
    typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt)
      ? obj.updatedAt
      : 0;

  return { primaryDocId, updatedAt };
}

export function serializeSessionRoutingState(state: SessionRoutingState): string {
  return JSON.stringify({
    primaryDocId: state.primaryDocId,
    updatedAt: state.updatedAt,
  });
}
