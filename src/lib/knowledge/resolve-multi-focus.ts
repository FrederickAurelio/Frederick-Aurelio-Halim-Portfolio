import { loadKnowledgeMap } from "./load-knowledge-map";
import type { KnowledgeMapSource } from "./types";
import {
  findDocIdsInText,
  findProjectDocIdsInText,
} from "./resolve-doc-id";
import {
  MULTI_DOC_ANSWER_HINT,
  MULTI_PROJECT_ANSWER_HINT,
  OTHER_PROJECTS_PATTERN,
  RECOMMEND_PATTERN,
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
  /\b(education|university|uni\b|college|graduat|degree|school|study|studied|studying|浙江科技|大学|学历|毕业|求学)\b/i;
const WORK_SIGNAL =
  /\b(work|job|jobs|experience|employment|mufy|career|intern|实习|工作|经历)\b/i;
const ALL_SHOWCASE_PATTERN =
  /\b(all (four|4)|all (projects|apps)|four projects|every project|each project|全部|四个项目)\b/i;
const PROJECTS_GENERAL_SIGNAL =
  /\b((some of )?your projects|those projects|side projects|personal projects|few projects|several projects|a few projects|portfolio projects|项目)\b/i;

/** Bio / location / education — do not pull project docIds from prior thread context. */
const PERSONAL_TOPIC_PATTERN =
  /\b(country|countries|study|studied|studying|school|university|education|background|who are you|languages?|indonesia|china|hangzhou|medan|live in|lived in|abroad|travel|工作或学习|国家|求学|留学)\b/i;

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

/** What each doc type covers — used in navigator hints and answer hints. */
export function describeDocCoverage(docId: string): string {
  const source = getSource(docId);
  if (!source) return "facts from this doc as asked";

  switch (source.type) {
    case "bio":
      return "bio: background, education, languages, interests, contact";
    case "experience":
      return "work: Mufy AI role, period (May 2025–June 2026), product, responsibilities, stack";
    case "project":
      return `${source.title}: what it is, features/stack/architecture as asked; repo + live demo links from context`;
    case "catalog":
      return "project catalog: showcase overview, where to start, flagship rationale, other GitHub repos";
    default:
      return `${source.title}: facts from context as asked`;
  }
}

/** Human-readable list of what multi_doc must cover for the answer model. */
export function buildMultiDocAnswerHint(
  docIds: string[],
  message = "",
): string {
  const lines = [
    MULTI_DOC_ANSWER_HINT,
    "",
    "Cover each focused area:",
    ...docIds.map((docId) => `- ${docId}: ${describeDocCoverage(docId)}`),
  ];

  if (CHRONO_PATTERN.test(message) || WORK_SIGNAL.test(message) || EDUCATION_SIGNAL.test(message)) {
    lines.push("", "Order events by documented dates when answering chronology or career timeline.");
  }

  if (RECOMMEND_PATTERN.test(message) && docIds.some((id) => isProjectDocId(id))) {
    lines.push(
      "",
      "If they also asked biggest/best/flagship: end with that project — name it, repo + live demo from context, brief why from facts.",
    );
  }

  return lines.join("\n");
}

/**
 * When the user combines topics (e.g. education + recommend a project), add implied docs
 * so a single-signal message still becomes multi_doc.
 */
function augmentDocIdsForCompoundAsks(docIds: string[], message: string): string[] {
  let result = unique(docIds);
  const trimmed = message.trim();

  if (RECOMMEND_PATTERN.test(trimmed)) {
    const nonCatalog = result.filter((id) => id !== "projects-overview");
    if (nonCatalog.length >= 1) {
      result = filterFocusDocIds(unique([...result, "quizconnect"]));
    }
  }

  if (OTHER_PROJECTS_PATTERN.test(trimmed) && !result.includes("projects-overview")) {
    result = unique([...result, "projects-overview"]);
  }

  return result;
}

export function planFromMultiFocusSet(
  multi: MultiFocusSet,
  message: string,
  base: Partial<RetrievalPlan> = {},
): RetrievalPlan {
  const include_sections =
    multi.intent === "multi_project"
      ? inferSectionsForMultiProject(message, base.include_sections ?? [])
      : inferSectionsForMultiDoc(message, multi.docIds, base.include_sections ?? []);

  return defaultRetrievalPlan({
    ...base,
    intent: multi.intent,
    focus_doc_ids: multi.docIds,
    include_sections,
    search_queries: [],
    answer_hint:
      base.answer_hint?.trim() ||
      (multi.intent === "multi_project"
        ? MULTI_PROJECT_ANSWER_HINT
        : buildMultiDocAnswerHint(multi.docIds, message)),
  });
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
    sections.push("mufy-at-a-glance", "mufy-product", "mufy-responsibilities");
    addedAspect = true;
  }
  if (CHRONO_PATTERN.test(message)) {
    for (const docId of docIds) {
      sections.push(...defaultSectionsForDoc(docId));
    }
    addedAspect = true;
  }
  if (RECOMMEND_PATTERN.test(message)) {
    sections.push("why-flagship", "where-to-start", "at-a-glance");
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
    const namesProject = findProjectDocIdsInText(trimmed).length > 0;
    if (!namesProject && PERSONAL_TOPIC_PATTERN.test(trimmed)) {
      // e.g. "work and study in China" — keep message-derived docs only, not old project thread.
    } else {
      const fromContext = filterFocusDocIds(resolveDocIdsFromMessage(context));
      if (fromContext.length >= 2) {
        docIds = fromContext;
        reason = "context_pair";
      }
    }
  }

  docIds = augmentDocIdsForCompoundAsks(docIds, trimmed);

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
  return plan.intent === "list_projects" || plan.intent === "off_topic";
}

export function applyMultiProjectFocus(
  plan: RetrievalPlan,
  message: string,
  context: string,
): RetrievalPlan {
  if (blockedIntent(plan)) return plan;

  const multi = resolveMultiProjectFocus(message, context);
  if (!multi) return plan;

  const docIds = filterFocusDocIds(
    unique([...plan.focus_doc_ids, ...multi.docIds]),
  ).slice(0, 4);

  return planFromMultiFocusSet(
    { ...multi, docIds, intent: "multi_project" },
    message,
    { ...plan, focus_doc_ids: docIds },
  );
}

export function applyMultiDocFocus(
  plan: RetrievalPlan,
  message: string,
  context: string,
): RetrievalPlan {
  if (
    blockedIntent(plan) ||
    plan.intent === "multi_project" ||
    plan.intent === "multi_doc"
  ) {
    return plan;
  }

  const multi = resolveMultiDocFocus(message, context);
  if (!multi) return plan;

  const docIds = filterFocusDocIds(
    unique([...plan.focus_doc_ids, ...multi.docIds]),
  ).slice(0, 4);

  return planFromMultiFocusSet(
    { ...multi, docIds, intent: "multi_doc" },
    message,
    { ...plan, focus_doc_ids: docIds },
  );
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

  const docIds = filterFocusDocIds(
    unique([...plan.focus_doc_ids, ...multi.docIds]),
  ).slice(0, 4);

  return planFromMultiFocusSet(
    { ...multi, docIds },
    message,
    { ...plan, focus_doc_ids: docIds },
  );
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
