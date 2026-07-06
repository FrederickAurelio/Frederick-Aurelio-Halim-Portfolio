import type { OpenRouterMessage } from "@/lib/openrouter/types";

import { buildRagSystemPrompt } from "./prompt";
import type { RetrievedChunk } from "./types";

export function buildRagMessages(
  chunks: RetrievedChunk[],
  history: OpenRouterMessage[],
  userMessage: string,
  systemPrompt?: string,
): OpenRouterMessage[] {
  return [
    {
      role: "system",
      content: systemPrompt ?? buildRagSystemPrompt(chunks, userMessage),
    },
    ...history,
    { role: "user", content: userMessage },
  ];
}
