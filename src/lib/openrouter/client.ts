import { getOpenRouterConfig } from "./config";
import { fetchWithTimeout } from "./fetch-with-timeout";
import type { OpenRouterMessage } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function createChatCompletion(params: {
  messages: OpenRouterMessage[];
  signal?: AbortSignal;
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: "none" | "high";
}): Promise<Response> {
  const config = getOpenRouterConfig();
  if (!config) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.httpReferer) {
    headers["HTTP-Referer"] = config.httpReferer;
  }

  if (config.appTitle) {
    headers["X-OpenRouter-Title"] = config.appTitle;
  }

  const reasoningEffort = params.reasoningEffort ?? "high";

  return fetchWithTimeout(OPENROUTER_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: params.messages,
      stream: false,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
      reasoning: { effort: reasoningEffort },
    }),
    signal: params.signal,
    timeoutMs: 30_000,
  });
}

export async function createChatCompletionStream(params: {
  messages: OpenRouterMessage[];
  signal?: AbortSignal;
}): Promise<Response> {
  const config = getOpenRouterConfig();
  if (!config) {
    throw new Error("OPENROUTER_NOT_CONFIGURED");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.httpReferer) {
    headers["HTTP-Referer"] = config.httpReferer;
  }

  if (config.appTitle) {
    headers["X-OpenRouter-Title"] = config.appTitle;
  }

  return fetchWithTimeout(OPENROUTER_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: params.messages,
      stream: true,
      reasoning: { effort: "high" },
    }),
    signal: params.signal,
    timeoutMs: 90_000,
  });
}
