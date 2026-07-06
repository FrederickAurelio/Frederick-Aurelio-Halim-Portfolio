import type { OpenRouterMessage } from "@/lib/openrouter/types";

export function buildRetrievalQuery(
  history: OpenRouterMessage[],
  currentMessage: string,
): string {
  const userMessages = history
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean);

  const previousUser = userMessages.at(-1);
  const current = currentMessage.trim();

  if (previousUser && previousUser !== current) {
    return `${previousUser}\n\n${current}`;
  }

  return current;
}
