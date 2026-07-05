import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { ChatMessagesPage, StoredChatMessage } from "@/lib/chat/types";

const PAGE_SIZE = 10;
const DEFAULT_RETENTION_SECONDS = 60 * 60 * 6;

function sortNewestFirst(messages: StoredChatMessage[]): StoredChatMessage[] {
  return [...messages].sort((a, b) => b.createdAt - a.createdAt);
}

export function appendMessagesToChatCache(
  queryClient: QueryClient,
  newMessages: StoredChatMessage[],
) {
  if (newMessages.length === 0) return;

  queryClient.setQueryData<InfiniteData<ChatMessagesPage>>(
    CHAT_MESSAGES_QUERY_KEY,
    (old) => {
      const upsertIds = new Set(newMessages.map((message) => message.id));
      const sortedNew = sortNewestFirst(newMessages);

      if (!old) {
        return {
          pages: [
            {
              messages: sortedNew,
              nextCursor: null,
              retentionSeconds: DEFAULT_RETENTION_SECONDS,
            },
          ],
          pageParams: [undefined],
        };
      }

      const firstPage = old.pages[0];
      const withoutUpserted = firstPage.messages.filter(
        (message) => !upsertIds.has(message.id),
      );
      const mergedMessages = sortNewestFirst([...sortedNew, ...withoutUpserted]);

      return {
        ...old,
        pages: [
          { ...firstPage, messages: mergedMessages },
          ...old.pages.slice(1),
        ],
      };
    },
  );
}

export async function fetchChatMessagesPage(
  before?: number,
): Promise<ChatMessagesPage> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (before !== undefined) params.set("before", String(before));

  const response = await fetch(`/api/chat/messages?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to load messages (${response.status})`);
  }
  return response.json() as Promise<ChatMessagesPage>;
}

export function hasStoredGeneratingAssistant(queryClient: QueryClient): boolean {
  const data = queryClient.getQueryData<InfiniteData<ChatMessagesPage>>(
    CHAT_MESSAGES_QUERY_KEY,
  );
  const latestPage = data?.pages[0];
  if (!latestPage) return false;

  return latestPage.messages.some(
    (message) => message.role === "assistant" && message.status === "generating",
  );
}

export const CHAT_MESSAGES_QUERY_KEY = ["chat-messages"] as const;
export { PAGE_SIZE };
