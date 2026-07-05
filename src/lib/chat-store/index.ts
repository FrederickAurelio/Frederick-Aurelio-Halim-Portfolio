import { createRedisChatStore } from "./redis-store";
import type { ChatStore } from "./types";
import { createUpstashChatStore } from "./upstash-store";

let store: ChatStore | null = null;

export type ChatStoreProvider = "redis" | "upstash";

function resolveProvider(): ChatStoreProvider {
  const provider = process.env.CHAT_STORE_PROVIDER?.trim().toLowerCase();
  if (provider === "upstash") return "upstash";
  return "redis";
}

export function getChatStore(): ChatStore {
  if (!store) {
    store =
      resolveProvider() === "upstash"
        ? createUpstashChatStore()
        : createRedisChatStore();
  }
  return store;
}

export type {
  ChatStore,
  PaginatedMessages,
  StoredChatMessage,
} from "./types";
export { getMessageRetentionSeconds } from "./keys";
