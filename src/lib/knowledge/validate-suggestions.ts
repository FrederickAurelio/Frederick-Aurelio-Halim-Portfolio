import { SUGGESTION_LIMIT_FOLLOW_UP } from "./pick-suggestions";

export const SUGGESTION_MAX_CHARS = 90;

export type ValidateSuggestionsInput = {
  items: string[];
  userMessages: string[];
  previousSuggestions?: string[];
  assistantAnswer?: string;
  max?: number;
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function textsOverlap(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 8 && right.length >= 8) {
    return left.includes(right) || right.includes(left);
  }
  return false;
}

function tokenizeMeaningfulWords(text: string): string[] {
  return normalizeText(text)
    .replace(/[^\w\u4e00-\u9fff\s-]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
}

function isContainedInAnswer(suggestion: string, answer: string): boolean {
  const normalizedAnswer = normalizeText(answer);
  const normalizedSuggestion = normalizeText(suggestion);
  if (!normalizedAnswer || !normalizedSuggestion) return false;
  if (normalizedAnswer.includes(normalizedSuggestion)) return true;

  const words = tokenizeMeaningfulWords(suggestion);
  if (words.length < 2) return false;
  const hits = words.filter((word) => normalizedAnswer.includes(word));
  return hits.length >= Math.ceil(words.length * 0.7);
}

export function validateSuggestions(input: ValidateSuggestionsInput): string[] {
  const max = input.max ?? SUGGESTION_LIMIT_FOLLOW_UP;
  const seen = new Set<string>();
  const results: string[] = [];

  const blocked = [
    ...input.userMessages,
    ...(input.previousSuggestions ?? []),
  ];

  for (const raw of input.items) {
    const item = raw.trim();
    if (!item || item.length > SUGGESTION_MAX_CHARS) continue;

    const key = normalizeText(item);
    if (seen.has(key)) continue;

    if (blocked.some((text) => textsOverlap(text, item))) continue;

    if (input.assistantAnswer && isContainedInAnswer(item, input.assistantAnswer)) {
      continue;
    }

    seen.add(key);
    results.push(item);
    if (results.length >= max) break;
  }

  return results;
}
