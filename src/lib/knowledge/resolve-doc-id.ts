import { loadKnowledgeMap } from "./load-knowledge-map";

function unique(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

/** Fuzzy project nicknames / typos → docId (checked before exact alias scan). */
const FUZZY_DOC_HINTS: { pattern: RegExp; docId: string }[] = [
  { pattern: /fx\s*trad|fxtrad|forex|fxtrade/i, docId: "nextjs-fxtrade" },
  { pattern: /quiz\s*connect|quizconnect|quizzconnect/i, docId: "quizconnect" },
  { pattern: /promis|conveyor/i, docId: "promis-conveyor-chain" },
  { pattern: /memories|scrapbook|konva/i, docId: "memories" },
];

const ABOUT_CLAUSE_PATTERN = /\b(?:now|what)\s+about\s+([^?.!,\n]+)/i;

function fuzzyDocIdFromText(text: string): string | null {
  for (const { pattern, docId } of FUZZY_DOC_HINTS) {
    if (pattern.test(text)) return docId;
  }
  return null;
}

/** All docIds whose id/title/alias appears in text (map order). */
export function findDocIdsInText(text: string): string[] {
  const map = loadKnowledgeMap();
  const lower = text.toLowerCase();
  const found: string[] = [];

  const fuzzy = fuzzyDocIdFromText(text);
  if (fuzzy) found.push(fuzzy);

  for (const source of map.sources) {
    const candidates = [source.docId, source.title, ...source.aliases];
    if (candidates.some((c) => lower.includes(c.toLowerCase()))) {
      found.push(source.docId);
    }
  }

  return unique(found);
}

const PROJECT_DOC_ID_CACHE = (): Set<string> => {
  const map = loadKnowledgeMap();
  return new Set(
    map.sources.filter((source) => source.type === "project").map((s) => s.docId),
  );
};

/** DocIds of type project only — excludes catalog/bio/experience. */
export function findProjectDocIdsInText(text: string): string[] {
  const projectIds = PROJECT_DOC_ID_CACHE();
  return findDocIdsInText(text).filter((id) => projectIds.has(id));
}

/**
 * Pick one docId for focus: current message (incl. fuzzy + "now about X") beats broad context.
 * Returns null when multiple projects are named — use resolveMultiProjectFocus instead.
 */
export function resolvePrimaryDocId(
  message: string,
  context: string,
): string | null {
  const trimmed = message.trim();
  const aboutMatch = trimmed.match(ABOUT_CLAUSE_PATTERN);
  const aboutClause = aboutMatch?.[1]?.trim() ?? "";

  if (aboutClause) {
    const fromAbout = findProjectDocIdsInText(aboutClause);
    if (fromAbout.length === 1) return fromAbout[0];
    if (fromAbout.length > 1) return null;
    const fuzzyAbout = fuzzyDocIdFromText(aboutClause);
    if (fuzzyAbout) return fuzzyAbout;
    const fromAboutAny = findDocIdsInText(aboutClause);
    if (fromAboutAny.length === 1) return fromAboutAny[0];
  }

  const inMessageProjects = findProjectDocIdsInText(trimmed);
  if (inMessageProjects.length === 1) return inMessageProjects[0];
  if (inMessageProjects.length > 1) return null;

  const fuzzyMessage = fuzzyDocIdFromText(trimmed);
  if (fuzzyMessage) return fuzzyMessage;

  const inMessage = findDocIdsInText(trimmed);
  if (inMessage.length === 1) return inMessage[0];

  const inContext = findDocIdsInText(context);
  if (inContext.length === 1) return inContext[0];

  return null;
}
