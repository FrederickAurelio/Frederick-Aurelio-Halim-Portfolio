export type RetrievalIntent =
  | "list_projects"
  | "recommend_project"
  | "multi_project"
  | "multi_doc"
  | "project_detail"
  | "bio"
  | "experience"
  | "pivot_other"
  | "follow_up"
  | "off_topic"
  | "general";

export type RetrievalPlan = {
  intent: RetrievalIntent;
  exclude_doc_ids: string[];
  focus_doc_ids: string[];
  include_sections: string[];
  search_queries: string[];
  answer_hint: string;
};

const INTENTS = new Set<RetrievalIntent>([
  "list_projects",
  "recommend_project",
  "multi_project",
  "multi_doc",
  "project_detail",
  "bio",
  "experience",
  "pivot_other",
  "follow_up",
  "off_topic",
  "general",
]);

function clampStrings(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function parseRetrievalPlan(raw: unknown): RetrievalPlan | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const intent = obj.intent;
  if (typeof intent !== "string" || !INTENTS.has(intent as RetrievalIntent)) {
    return null;
  }

  return {
    intent: intent as RetrievalIntent,
    exclude_doc_ids: clampStrings(obj.exclude_doc_ids, 4),
    focus_doc_ids: clampStrings(obj.focus_doc_ids, 4),
    include_sections: clampStrings(obj.include_sections, 6),
    search_queries: clampStrings(obj.search_queries, 4),
    answer_hint: typeof obj.answer_hint === "string" ? obj.answer_hint.trim() : "",
  };
}

export function defaultRetrievalPlan(
  partial?: Partial<RetrievalPlan>,
): RetrievalPlan {
  return {
    intent: partial?.intent ?? "general",
    exclude_doc_ids: partial?.exclude_doc_ids ?? [],
    focus_doc_ids: partial?.focus_doc_ids ?? [],
    include_sections: partial?.include_sections ?? [],
    search_queries: partial?.search_queries ?? [],
    answer_hint: partial?.answer_hint ?? "",
  };
}
