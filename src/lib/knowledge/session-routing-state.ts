import { resolvePrimaryDocId } from "./resolve-doc-id";
import {
  defaultRetrievalPlan,
  type RetrievalIntent,
  type RetrievalPlan,
} from "./retrieval-plan";

export type SessionRoutingState = {
  primaryDocId: string | null;
  lastIntent: RetrievalIntent | null;
  updatedAt: number;
};

export const EMPTY_SESSION_ROUTING_STATE: SessionRoutingState = {
  primaryDocId: null,
  lastIntent: null,
  updatedAt: 0,
};

const CASUAL_NOISE_PATTERN =
  /^(hai|hi|hey|yo|lol|lmao|haha|ok|okay|nice|cool|thanks|thx|ty|wow|emm+|uh+|ah+|oh+|yo+|666|👍|😂|🤣|哈+|嗯+|啊+)[\s!.?~]*$/iu;

const RESUME_TOPIC_PATTERN =
  /\b(back to (the )?main topic|back to that|as i was saying|anyway|where were we|回到正题|刚才那个|继续讲|继续说)\b/i;

const VAGUE_ASPECT_PATTERN =
  /\b(stack|tech stack|technology|framework|libraries|auth|authentication|deploy|deployment|architecture|how does|how do you|tell me more|what about|用什么|技术栈|怎么实现|架构|部署)\b/i;

const PORTFOLIO_KEYWORD_PATTERN =
  /\b(project|stack|frederick|quiz|fx|memories|mufy|portfolio|work|job|skill|demo|github|经验|项目)\b|[\u4e00-\u9fff]/i;

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
  return VAGUE_ASPECT_PATTERN.test(trimmed);
}

export function formatSessionTopicForPrompt(state: SessionRoutingState): string {
  const doc = state.primaryDocId ?? "none";
  return `<session_topic>
  primaryDocId: ${doc}
  note: "main topic" / vague follow-ups refer to primaryDocId unless the user names a different project.
  If primaryDocId is set and the user asks a vague follow-up ("what stack?", "how does auth work?", "back to main topic") without naming another project, you MUST set focus_doc_ids to [primaryDocId].
</session_topic>`;
}

/** Safety net: fill empty focus from sticky session topic (never overrides planner focus). */
export function applySessionRoutingToPlan(
  plan: RetrievalPlan,
  currentMessage: string,
  session: SessionRoutingState,
): RetrievalPlan {
  const message = currentMessage.trim();

  if (isCasualNoise(message)) return plan;
  if (resolvePrimaryDocId(message, "")) return plan;
  if (plan.focus_doc_ids.length > 0) return plan;
  if (!session.primaryDocId) return plan;
  if (plan.intent === "list_projects" || plan.intent === "recommend_project") {
    return plan;
  }
  if (plan.intent === "off_topic" && !isVagueFollowUp(message) && !isResumeTopicPhrase(message)) {
    return plan;
  }
  if (!isVagueFollowUp(message) && !isResumeTopicPhrase(message)) return plan;

  if (process.env.RAG_LOG_SESSION_APPLY === "1") {
    console.debug("[rag] session apply", {
      primaryDocId: session.primaryDocId,
      message,
    });
  }

  return defaultRetrievalPlan({
    ...plan,
    intent: "follow_up",
    focus_doc_ids: [session.primaryDocId],
  });
}

export function computeNextRoutingState(
  previous: SessionRoutingState,
  plan: RetrievalPlan,
  currentMessage: string,
): SessionRoutingState {
  const now = Date.now();
  const message = currentMessage.trim();

  if (plan.intent === "pivot_other") {
    return {
      primaryDocId: null,
      lastIntent: plan.intent,
      updatedAt: now,
    };
  }

  if (isCasualNoise(message) || plan.intent === "off_topic") {
    return {
      ...previous,
      lastIntent: plan.intent,
      updatedAt: now,
    };
  }

  if (plan.intent === "recommend_project") {
    return {
      primaryDocId: "quizconnect",
      lastIntent: plan.intent,
      updatedAt: now,
    };
  }

  if (plan.intent === "list_projects") {
    return {
      primaryDocId: "projects-overview",
      lastIntent: plan.intent,
      updatedAt: now,
    };
  }

  const explicit = resolvePrimaryDocId(message, "");
  if (explicit) {
    return {
      primaryDocId: explicit,
      lastIntent: plan.intent,
      updatedAt: now,
    };
  }

  const focus = plan.focus_doc_ids[0];
  if (focus) {
    return {
      primaryDocId: focus,
      lastIntent: plan.intent,
      updatedAt: now,
    };
  }

  return {
    ...previous,
    lastIntent: plan.intent,
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
  const lastIntent =
    typeof obj.lastIntent === "string" ? (obj.lastIntent as RetrievalIntent) : null;
  const updatedAt =
    typeof obj.updatedAt === "number" && Number.isFinite(obj.updatedAt)
      ? obj.updatedAt
      : 0;

  return { primaryDocId, lastIntent, updatedAt };
}

export function serializeSessionRoutingState(state: SessionRoutingState): string {
  return JSON.stringify(state);
}
