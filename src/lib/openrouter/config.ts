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

export function getRagMaxContextChunks(): number {
  return parsePositiveInt(process.env.RAG_MAX_CONTEXT_CHUNKS, 16);
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/** User/assistant pairs passed to the retrieval navigator LLM (default 6). */
export function getRagNavigatorTurnPairs(): number {
  return parsePositiveInt(process.env.RAG_NAVIGATOR_TURN_PAIRS, 6);
}

/** Max assistant chars per turn in navigator context (default 1500). */
export function getRagNavigatorMaxAssistantChars(): number {
  return parsePositiveInt(process.env.RAG_NAVIGATOR_MAX_ASSISTANT_CHARS, 1500);
}

