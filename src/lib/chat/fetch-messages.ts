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
      const existingIds = old
        ? new Set(old.pages.flatMap((page) => page.messages.map((m) => m.id)))
        : new Set<string>();

      const toAdd = newMessages.filter((message) => !existingIds.has(message.id));
      if (toAdd.length === 0) return old;

      const sortedNew = sortNewestFirst(toAdd);

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
      const mergedMessages = sortNewestFirst([
        ...sortedNew,
        ...firstPage.messages,
      ]);

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

export const CHAT_MESSAGES_QUERY_KEY = ["chat-messages"] as const;
export { PAGE_SIZE };
