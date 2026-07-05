import { getOpenRouterConfig } from "./config";
import type { OpenRouterMessage } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: params.messages,
      stream: true,
      reasoning: { effort: "high" },
    }),
    signal: params.signal,
  });
}
