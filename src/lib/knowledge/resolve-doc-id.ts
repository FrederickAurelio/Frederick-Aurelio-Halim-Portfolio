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

/**
 * Pick one docId for focus: current message (incl. fuzzy + "now about X") beats broad context.
 */
export function resolvePrimaryDocId(
  message: string,
  context: string,
): string | null {
  const trimmed = message.trim();
  const aboutMatch = trimmed.match(ABOUT_CLAUSE_PATTERN);
  const aboutClause = aboutMatch?.[1]?.trim() ?? "";

  if (aboutClause) {
    const fromAbout = findDocIdsInText(aboutClause);
    if (fromAbout.length > 0) return fromAbout[0];
    const fuzzyAbout = fuzzyDocIdFromText(aboutClause);
    if (fuzzyAbout) return fuzzyAbout;
  }

  const fuzzyMessage = fuzzyDocIdFromText(trimmed);
  if (fuzzyMessage) return fuzzyMessage;

  const inMessage = findDocIdsInText(trimmed);
  if (inMessage.length === 1) return inMessage[0];
  if (inMessage.length > 1) return inMessage[0];

  const inContext = findDocIdsInText(context);
  if (inContext.length === 1) return inContext[0];

  return null;
}

export function resolveFocusDocIds(
  message: string,
  context: string,
  max = 2,
): string[] {
  const primary = resolvePrimaryDocId(message, context);
  if (primary) return [primary];

  return findDocIdsInText(`${message}\n${context}`).slice(0, max);
}
