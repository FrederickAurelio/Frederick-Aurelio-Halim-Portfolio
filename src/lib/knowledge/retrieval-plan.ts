import type { KnowledgeMap } from "./types";

export type RetrievalTopic = {
  label: string;
  query: string;
  preferDocId?: string;
};

export type RetrievalPlan = {
  topics: RetrievalTopic[];
  answer_hint: string;
  prefer_doc_ids: string[];
  exclude_doc_ids: string[];
  off_topic: boolean;
};

const MAX_TOPICS = 4;
const MAX_DOC_IDS = 4;

function clampStrings(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function knownDocIds(map: KnowledgeMap): Set<string> {
  return new Set(map.sources.map((source) => source.docId));
}

function parseTopic(raw: unknown, known: Set<string>): RetrievalTopic | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const label =
    typeof obj.label === "string" && obj.label.trim()
      ? obj.label.trim()
      : "topic";
  const query = typeof obj.query === "string" ? obj.query.trim() : "";
  if (!query) return null;

  let preferDocId: string | undefined;
  const preferRaw =
    typeof obj.preferDocId === "string"
      ? obj.preferDocId.trim()
      : typeof obj.prefer_doc_id === "string"
        ? obj.prefer_doc_id.trim()
        : "";
  if (preferRaw && known.has(preferRaw)) {
    preferDocId = preferRaw;
  }

  return preferDocId ? { label, query, preferDocId } : { label, query };
}

export function defaultRetrievalPlan(
  partial?: Partial<RetrievalPlan>,
): RetrievalPlan {
  return {
    topics: partial?.topics ?? [],
    answer_hint: partial?.answer_hint ?? "",
    prefer_doc_ids: partial?.prefer_doc_ids ?? [],
    exclude_doc_ids: partial?.exclude_doc_ids ?? [],
    off_topic: partial?.off_topic ?? false,
  };
}

export function parseRetrievalPlan(
  raw: unknown,
  map: KnowledgeMap,
): RetrievalPlan | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const known = knownDocIds(map);
  const off_topic = obj.off_topic === true;

  const topicsRaw = Array.isArray(obj.topics) ? obj.topics : [];
  const topics: RetrievalTopic[] = [];
  for (const item of topicsRaw) {
    const topic = parseTopic(item, known);
    if (topic) topics.push(topic);
    if (topics.length >= MAX_TOPICS) break;
  }

  const prefer_doc_ids = clampStrings(obj.prefer_doc_ids, MAX_DOC_IDS).filter(
    (id) => known.has(id),
  );
  const exclude_doc_ids = clampStrings(obj.exclude_doc_ids, MAX_DOC_IDS).filter(
    (id) => known.has(id),
  );
  const answer_hint =
    typeof obj.answer_hint === "string" ? obj.answer_hint.trim() : "";

  return {
    topics,
    answer_hint,
    prefer_doc_ids,
    exclude_doc_ids,
    off_topic,
  };
}

export function simpleFallbackPlan(
  message: string,
  primaryDocId: string | null,
): RetrievalPlan {
  const query = message.trim();
  if (!query) {
    return defaultRetrievalPlan({ off_topic: false, topics: [] });
  }

  const prefer = primaryDocId?.trim() || undefined;
  return defaultRetrievalPlan({
    topics: [
      prefer
        ? { label: "general", query, preferDocId: prefer }
        : { label: "general", query },
    ],
    prefer_doc_ids: prefer ? [prefer] : [],
    answer_hint: "",
    off_topic: false,
  });
}

export type FinalizePlanOptions = {
  message: string;
  primaryDocId: string | null;
  map: KnowledgeMap;
  /** When true, fill sticky topic for vague follow-ups with empty/generic topics. */
  applySticky?: boolean;
  isVagueFollowUp?: (message: string) => boolean;
  docTitle?: (docId: string) => string | undefined;
};

/**
 * Clamp/validate plan. Sticky fill is applied only when applySticky + vague follow-up.
 */
export function finalizePlan(
  plan: RetrievalPlan,
  options: FinalizePlanOptions,
): RetrievalPlan {
  const known = knownDocIds(options.map);
  const message = options.message.trim();

  if (plan.off_topic) {
    return defaultRetrievalPlan({
      off_topic: true,
      answer_hint: plan.answer_hint,
    });
  }

  const topics: RetrievalTopic[] = [];
  for (const topic of plan.topics) {
    const query = topic.query.trim();
    if (!query) continue;
    const label = topic.label.trim() || "topic";
    const preferDocId =
      topic.preferDocId && known.has(topic.preferDocId)
        ? topic.preferDocId
        : undefined;
    topics.push(
      preferDocId ? { label, query, preferDocId } : { label, query },
    );
    if (topics.length >= MAX_TOPICS) break;
  }

  let prefer_doc_ids = plan.prefer_doc_ids
    .filter((id) => known.has(id))
    .slice(0, MAX_DOC_IDS);
  const exclude_doc_ids = plan.exclude_doc_ids
    .filter((id) => known.has(id))
    .slice(0, MAX_DOC_IDS);

  let workingTopics = topics;
  let answer_hint = plan.answer_hint;

  const stickyId = options.primaryDocId?.trim() || null;
  const shouldSticky =
    options.applySticky !== false &&
    Boolean(stickyId) &&
    stickyId !== null &&
    known.has(stickyId) &&
    options.isVagueFollowUp?.(message) &&
    (workingTopics.length === 0 ||
      (workingTopics.length === 1 &&
        workingTopics[0].label === "general" &&
        !workingTopics[0].preferDocId));

  if (shouldSticky && stickyId) {
    const title = options.docTitle?.(stickyId) ?? stickyId;
    workingTopics = [
      {
        label: "follow_up",
        query: `${title} ${message}`.trim(),
        preferDocId: stickyId,
      },
    ];
    prefer_doc_ids = [stickyId];
  }

  if (workingTopics.length === 0 && message) {
    workingTopics = [{ label: "general", query: message }];
  }

  for (const topic of workingTopics) {
    if (topic.preferDocId && !prefer_doc_ids.includes(topic.preferDocId)) {
      prefer_doc_ids.push(topic.preferDocId);
    }
  }
  prefer_doc_ids = prefer_doc_ids.slice(0, MAX_DOC_IDS);

  return defaultRetrievalPlan({
    topics: workingTopics,
    answer_hint,
    prefer_doc_ids,
    exclude_doc_ids,
    off_topic: false,
  });
}
