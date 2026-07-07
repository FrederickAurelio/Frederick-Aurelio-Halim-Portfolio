import { loadKnowledgeMap } from "./load-knowledge-map";
import type { KnowledgeMapSource } from "./types";
import {
  findDocIdsInText,
  findProjectDocIdsInText,
} from "./resolve-doc-id";
import {
  MULTI_DOC_ANSWER_HINT,
  MULTI_PROJECT_ANSWER_HINT,
} from "./retrieval-patterns";
import { defaultRetrievalPlan, type RetrievalPlan } from "./retrieval-plan";

export const SHOWCASE_PROJECT_DOC_IDS = [
  "quizconnect",
  "memories",
  "nextjs-fxtrade",
  "promis-conveyor-chain",
] as const;

const COMPARE_PATTERN =
  /\b(vs\.?|versus|compare|compared|difference between|哪个更好|对比|比较)\b/i;
const STACK_PATTERN =
  /\b(stack|tech|technology|framework|libraries|用什么|技术栈)\b/i;
const ARCHITECTURE_PATTERN =
  /\b(architecture|how (is|does) it work|system design|架构|怎么实现)\b/i;
const AUTH_PATTERN = /\b(auth|authentication|login|sign[- ]?up|授权|登录|认证)\b/i;
const DEPLOY_PATTERN = /\b(deploy|deployment|docker|ci\/?cd|部署)\b/i;
const CHRONO_PATTERN =
  /\b(chronolog|timeline|time\s*line|from when|since|career|life story|时间线|先后|顺序)\b/i;
const EDUCATION_SIGNAL =
  /\b(education|university|uni\b|college|graduat|degree|school|浙江科技|大学|学历|毕业|求学)\b/i;
const WORK_SIGNAL =
  /\b(work|job|jobs|experience|employment|mufy|career|intern|实习|工作|经历)\b/i;
const ALL_SHOWCASE_PATTERN =
  /\b(all (four|4)|all (projects|apps)|four projects|every project|each project|全部|四个项目)\b/i;
const PROJECTS_GENERAL_SIGNAL =
  /\b((some of )?your projects|those projects|side projects|personal projects|few projects|several projects|a few projects|portfolio projects|项目)\b/i;

/** Regex → docId when the user names a topic implicitly (not only by title/alias). */
const IMPLICIT_DOC_SIGNALS: { docId: string; patterns: RegExp[] }[] = [
  {
    docId: "about-me",
    patterns: [
      EDUCATION_SIGNAL,
      /\b(who are you|about you|background|bio|languages?|medan|indonesia|林健昌|自我介绍|背景)\b/i,
      CHRONO_PATTERN,
    ],
  },
  {
    docId: "work-experience",
    patterns: [
      WORK_SIGNAL,
      /\b(mufy\s*ai|employer|company\s*work|工作经历)\b/i,
    ],
  },
  {
    docId: "projects-overview",
    patterns: [
      /\b(all projects|portfolio projects|project list|项目列表|哪些项目)\b/i,
      PROJECTS_GENERAL_SIGNAL,
    ],
  },
];

export type MultiFocusReason =
  | MultiProjectReason
  | MultiDocReason;

export type MultiFocusSet = {
  docIds: string[];
  intent: "multi_project" | "multi_doc";
  reason: MultiFocusReason;
};

export type MultiProjectReason =
  | "explicit_names"
  | "compare"
  | "all_showcase"
  | "context_pair";

export type MultiDocReason =
  | "explicit_names"
  | "implicit_signals"
  | "compare"
  | "context_pair";

export type MultiProjectResult = {
  docIds: string[];
  reason: MultiProjectReason;
};

export type MultiDocResult = {
  docIds: string[];
  reason: MultiDocReason;
};

function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

function getSource(docId: string): KnowledgeMapSource | undefined {
  return loadKnowledgeMap().sources.find((source) => source.docId === docId);
}

function isProjectDocId(docId: string): boolean {
  return getSource(docId)?.type === "project";
}

function allAreProjectDocIds(docIds: string[]): boolean {
  return docIds.length > 0 && docIds.every(isProjectDocId);
}

/** Explicit aliases/titles + implicit topic signals + fuzzy project names. */
export function resolveDocIdsFromMessage(message: string): string[] {
  const trimmed = message.trim();
  if (!trimmed) return [];

  const found: string[] = [
    ...findDocIdsInText(trimmed),
    ...findProjectDocIdsInText(trimmed),
  ];

  for (const { docId, patterns } of IMPLICIT_DOC_SIGNALS) {
    if (patterns.some((pattern) => pattern.test(trimmed))) {
      found.push(docId);
    }
  }

  return unique(found);
}

/** Drop catalog overview when specific projects are already in focus. */
export function filterFocusDocIds(docIds: string[]): string[] {
  const uniqueIds = unique(docIds);
  const hasSpecificProject = uniqueIds.some(
    (id) => isProjectDocId(id) && id !== "projects-overview",
  );
  if (!hasSpecificProject) return uniqueIds;
  return uniqueIds.filter((id) => id !== "projects-overview");
}

function hasProjectAspectKeyword(message: string): boolean {
  return (
    STACK_PATTERN.test(message) ||
    ARCHITECTURE_PATTERN.test(message) ||
    AUTH_PATTERN.test(message) ||
    DEPLOY_PATTERN.test(message) ||
    COMPARE_PATTERN.test(message)
  );
}

function hasGeneralAspectKeyword(message: string): boolean {
  return (
    hasProjectAspectKeyword(message) ||
    EDUCATION_SIGNAL.test(message) ||
    WORK_SIGNAL.test(message) ||
    CHRONO_PATTERN.test(message) ||
    COMPARE_PATTERN.test(message)
  );
}

/** Default sections per doc type when the user did not name a specific aspect. */
function defaultSectionsForDoc(docId: string): string[] {
  const type = getSource(docId)?.type;
  switch (type) {
    case "project":
      return ["at-a-glance"];
    case "bio":
      return ["at-a-glance", "education", "background"];
    case "experience":
      return ["mufy-at-a-glance"];
    case "catalog":
      return ["overview"];
    default:
      return ["at-a-glance"];
  }
}

/** Infer sections for multi_project (projects only). */
export function inferSectionsForMultiProject(
  message: string,
  existing: string[] = [],
): string[] {
  const sections = [...existing];

  if (STACK_PATTERN.test(message)) sections.push("tech-stack");
  else if (ARCHITECTURE_PATTERN.test(message)) sections.push("architecture");
  else if (AUTH_PATTERN.test(message)) sections.push("tech-stack", "at-a-glance");
  else if (DEPLOY_PATTERN.test(message)) sections.push("tech-stack", "architecture");
  else if (COMPARE_PATTERN.test(message)) sections.push("at-a-glance");
  else sections.push("at-a-glance");

  return unique(sections);
}

/** General section inference for any multi_doc focus set. */
export function inferSectionsForMultiDoc(
  message: string,
  docIds: string[],
  existing: string[] = [],
): string[] {
  const sections = [...existing];
  let addedAspect = false;

  if (STACK_PATTERN.test(message)) {
    sections.push("tech-stack");
    addedAspect = true;
  }
  if (ARCHITECTURE_PATTERN.test(message)) {
    sections.push("architecture");
    addedAspect = true;
  }
  if (AUTH_PATTERN.test(message)) {
    sections.push("tech-stack", "at-a-glance");
    addedAspect = true;
  }
  if (DEPLOY_PATTERN.test(message)) {
    sections.push("tech-stack", "architecture");
    addedAspect = true;
  }
  if (COMPARE_PATTERN.test(message)) {
    sections.push("at-a-glance");
    addedAspect = true;
  }
  if (EDUCATION_SIGNAL.test(message)) {
    sections.push("education", "background");
    addedAspect = true;
  }
  if (WORK_SIGNAL.test(message)) {
    sections.push("mufy-at-a-glance", "mufy-product");
    addedAspect = true;
  }
  if (CHRONO_PATTERN.test(message)) {
    for (const docId of docIds) {
      sections.push(...defaultSectionsForDoc(docId));
    }
    addedAspect = true;
  }

  if (!addedAspect) {
    for (const docId of docIds) {
      sections.push(...defaultSectionsForDoc(docId));
    }
  }

  return unique(sections);
}

/**
 * Unified multi-focus: gather every doc implied by the message (and context when needed).
 * Uses multi_project only when ALL focused docs are projects; otherwise multi_doc.
 */
export function resolveMultiFocusSet(
  message: string,
  context: string,
  options?: { max?: number },
): MultiFocusSet | null {
  const max = options?.max ?? 4;
  const trimmed = message.trim();
  if (!trimmed) return null;

  let docIds = filterFocusDocIds(resolveDocIdsFromMessage(trimmed));
  let reason: MultiFocusReason = "explicit_names";

  if (ALL_SHOWCASE_PATTERN.test(trimmed)) {
    const nonProjects = docIds.filter((id) => !isProjectDocId(id));
    docIds = unique([...nonProjects, ...SHOWCASE_PROJECT_DOC_IDS]);
    reason = "all_showcase";
  }

  if (COMPARE_PATTERN.test(trimmed)) {
    const compared = filterFocusDocIds(
      unique([
        ...resolveDocIdsFromMessage(trimmed),
        ...resolveDocIdsFromMessage(context),
      ]),
    );
    if (compared.length > docIds.length) {
      docIds = compared;
      reason = "compare";
    }
  }

  if (docIds.length < 2 && hasGeneralAspectKeyword(trimmed)) {
    const fromContext = filterFocusDocIds(resolveDocIdsFromMessage(context));
    if (fromContext.length >= 2) {
      docIds = fromContext;
      reason = "context_pair";
    }
  }

  if (docIds.length < 2) return null;

  const onlyImplicit =
    !findDocIdsInText(trimmed).some((id) => docIds.includes(id)) &&
    findProjectDocIdsInText(trimmed).length === 0;
  if (onlyImplicit && reason === "explicit_names") {
    reason = "implicit_signals";
  }

  docIds = docIds.slice(0, max);
  const intent: MultiFocusSet["intent"] = allAreProjectDocIds(docIds)
    ? "multi_project"
    : "multi_doc";

  return { docIds, intent, reason };
}

/**
 * 2+ showcase projects in one turn — project-specific path.
 * Returns null when the focus set is mixed or non-project.
 */
export function resolveMultiProjectFocus(
  message: string,
  context: string,
  options?: { max?: number },
): MultiProjectResult | null {
  const unified = resolveMultiFocusSet(message, context, options);
  if (!unified || unified.intent !== "multi_project") return null;
  return { docIds: unified.docIds, reason: unified.reason as MultiProjectReason };
}

/**
 * General multi-doc: 2+ distinct docs (any type), explicit or implicit.
 */
export function resolveMultiDocFocus(
  message: string,
  context: string,
  options?: { max?: number },
): MultiDocResult | null {
  const unified = resolveMultiFocusSet(message, context, options);
  if (!unified || unified.intent !== "multi_doc") return null;
  return { docIds: unified.docIds, reason: unified.reason as MultiDocReason };
}

export function hasMultiDocQuestion(message: string, context = ""): boolean {
  return resolveMultiFocusSet(message, context) !== null;
}

function blockedIntent(plan: RetrievalPlan): boolean {
  return (
    plan.intent === "list_projects" ||
    plan.intent === "recommend_project" ||
    plan.intent === "off_topic"
  );
}

export function applyMultiProjectFocus(
  plan: RetrievalPlan,
  message: string,
  context: string,
): RetrievalPlan {
  if (blockedIntent(plan)) return plan;

  const multi = resolveMultiProjectFocus(message, context);
  if (!multi) return plan;

  const docIds = unique([...plan.focus_doc_ids, ...multi.docIds]).slice(0, 4);

  return defaultRetrievalPlan({
    ...plan,
    intent: "multi_project",
    focus_doc_ids: docIds,
    include_sections: inferSectionsForMultiProject(message, plan.include_sections),
    search_queries: [],
    answer_hint: plan.answer_hint || MULTI_PROJECT_ANSWER_HINT,
  });
}

export function applyMultiDocFocus(
  plan: RetrievalPlan,
  message: string,
  context: string,
): RetrievalPlan {
  if (blockedIntent(plan) || plan.intent === "multi_project" || plan.intent === "multi_doc") {
    return plan;
  }

  const multi = resolveMultiDocFocus(message, context);
  if (!multi) return plan;

  const docIds = unique([...plan.focus_doc_ids, ...multi.docIds]).slice(0, 4);

  return defaultRetrievalPlan({
    ...plan,
    intent: "multi_doc",
    focus_doc_ids: docIds,
    include_sections: inferSectionsForMultiDoc(message, docIds, plan.include_sections),
    search_queries: [],
    answer_hint: plan.answer_hint || MULTI_DOC_ANSWER_HINT,
  });
}

/** Unified multi-focus: mixed work + projects → multi_doc with every doc. */
export function applyMultiFocus(
  plan: RetrievalPlan,
  message: string,
  context: string,
): RetrievalPlan {
  if (blockedIntent(plan)) return plan;

  const multi = resolveMultiFocusSet(message, context);
  if (!multi) return plan;

  const docIds = unique([...plan.focus_doc_ids, ...multi.docIds]).slice(0, 4);
  const include_sections =
    multi.intent === "multi_project"
      ? inferSectionsForMultiProject(message, plan.include_sections)
      : inferSectionsForMultiDoc(message, docIds, plan.include_sections);

  return defaultRetrievalPlan({
    ...plan,
    intent: multi.intent,
    focus_doc_ids: docIds,
    include_sections,
    search_queries: [],
    answer_hint:
      plan.answer_hint ||
      (multi.intent === "multi_project"
        ? MULTI_PROJECT_ANSWER_HINT
        : MULTI_DOC_ANSWER_HINT),
  });
}

export function getShowcaseProjectDocIds(): string[] {
  return loadKnowledgeMap()
    .sources.filter((source) => source.type === "project")
    .map((source) => source.docId);
}

/** Resolve up to max docIds when message implies multiple topics. */
export function resolveFocusDocIds(
  message: string,
  context: string,
  max = 4,
): string[] {
  const fromMessage = filterFocusDocIds(resolveDocIdsFromMessage(message));
  if (fromMessage.length >= 2) return fromMessage.slice(0, max);

  const multi = findProjectDocIdsInText(`${message}\n${context}`);
  if (multi.length >= 2) return multi.slice(0, max);

  const unified = resolveMultiFocusSet(message, context, { max });
  if (unified) return unified.docIds;

  const fromContext = filterFocusDocIds(resolveDocIdsFromMessage(context));
  if (fromContext.length >= 2) return fromContext.slice(0, max);

  return findDocIdsInText(`${message}\n${context}`).slice(0, max);
}

/** @deprecated Use inferSectionsForMultiProject */
export const inferSectionsForMulti = inferSectionsForMultiProject;
