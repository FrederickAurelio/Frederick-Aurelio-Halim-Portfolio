import { getOpenRouterConfig } from "./config";
import { fetchWithTimeout } from "./fetch-with-timeout";

const OPENROUTER_EMBEDDINGS_URL = "https://openrouter.ai/api/v1/embeddings";

export type EmbeddingResult = {
  vector: number[];
  model: string;
};

export async function createEmbedding(
  input: string | string[],
  signal?: AbortSignal,
): Promise<EmbeddingResult[]> {
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

  const response = await fetchWithTimeout(OPENROUTER_EMBEDDINGS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.embeddingModel,
      input,
    }),
    signal,
    timeoutMs: 45_000,
  });

  if (!response.ok) {
    let message = `Embedding request failed (${response.status})`;
    try {
      const body = (await response.json()) as {
        error?: { message?: string };
      };
      message = body.error?.message ?? message;
    } catch {
      // use default
    }
    throw new Error(message);
  }

  const body = (await response.json()) as {
    data: { embedding: number[]; index: number }[];
    model?: string;
  };

  const model = body.model ?? config.embeddingModel;
  return body.data
    .sort((a, b) => a.index - b.index)
    .map((item) => ({ vector: item.embedding, model }));
}
