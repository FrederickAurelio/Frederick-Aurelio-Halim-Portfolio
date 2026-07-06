import type { OpenRouterConfig } from "./types";

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const DEFAULT_EMBEDDING_MODEL = "qwen/qwen3-embedding-8b";

export function getOpenRouterConfig(): OpenRouterConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
    embeddingModel:
      process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL,
    httpReferer: process.env.OPENROUTER_HTTP_REFERER?.trim() || undefined,
    appTitle: process.env.OPENROUTER_APP_TITLE?.trim() || undefined,
  };
}

export function getRagTopK(): number {
  const raw = process.env.RAG_TOP_K;
  if (!raw) return 4;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 4;
  return parsed;
}

export function getRagMinScore(): number {
  const raw = process.env.RAG_MIN_SCORE;
  if (!raw) return 0.32;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0.32;
  return parsed;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/** User/assistant pairs passed to the retrieval navigator LLM (default 3). */
export function getRagNavigatorTurnPairs(): number {
  return parsePositiveInt(process.env.RAG_NAVIGATOR_TURN_PAIRS, 3);
}

/** Recent chat messages used by enrich rules / doc resolution (default 4). */
export function getRagEnrichContextMessages(): number {
  return parsePositiveInt(process.env.RAG_ENRICH_CONTEXT_MESSAGES, 4);
}
