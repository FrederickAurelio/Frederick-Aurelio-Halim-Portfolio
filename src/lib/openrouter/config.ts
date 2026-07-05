import type { OpenRouterConfig } from "./types";

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";

export function getOpenRouterConfig(): OpenRouterConfig | null {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
    httpReferer: process.env.OPENROUTER_HTTP_REFERER?.trim() || undefined,
    appTitle: process.env.OPENROUTER_APP_TITLE?.trim() || undefined,
  };
}
