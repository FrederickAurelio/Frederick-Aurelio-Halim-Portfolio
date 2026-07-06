import { Redis } from "@upstash/redis/node";
import type { OpenRouterMessage } from "@/lib/openrouter/types";
import {
  buildPaginatedResult,
  getMessageRetentionSeconds,
  loadMessagesByIds,
  messageKey,
  serializeStoredMessage,
  timelineKey,
} from "./keys";
import { createUpstashGenerationLockOps } from "./generation-lock";
import { createUpstashGenerationBufferOps } from "./generation-buffer";
import { touchSessionTtlUpstash } from "./touch-session";
import type { ChatStore, PaginatedMessages } from "./types";
import {
  applyPendingUpstashSyncToken,
  registerUpstashClient,
} from "./upstash-sync.server";

let client: Redis | null = null;

const UPSTASH_REQUEST_TIMEOUT_MS = 15_000;

function getUpstashClient(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("Upstash Redis is not configured");
    }
    // Match ioredis string semantics — we JSON.stringify on write and parse on read.
    // Upstash defaults to automaticDeserialization, which would return objects from
    // GET and break parseStoredMessage (double-parse → null).
    client = new Redis({
      url,
      token,
      automaticDeserialization: false,
      enableAutoPipelining: true,
      signal: () => AbortSignal.timeout(UPSTASH_REQUEST_TIMEOUT_MS),
      retry: { retries: 2, backoff: () => 300 },
    });
    registerUpstashClient(client);
  }

  applyPendingUpstashSyncToken();
  return client;
}

function withRetention(
  result: Omit<PaginatedMessages, "retentionSeconds">,
): PaginatedMessages {
  return { ...result, retentionSeconds: getMessageRetentionSeconds() };
}

function loadSessionMessages(redis: Redis, sessionId: string, ids: string[]) {
  return loadMessagesByIds(ids, async (messageIds) => {
    if (messageIds.length === 0) return [];
    const keys = messageIds.map((id) => messageKey(sessionId, id));
    const values = await redis.mget<(string | null)[]>(...keys);
    return values;
  });
}

export function createUpstashChatStore(): ChatStore {
  const redis = getUpstashClient();
  const generationLock = createUpstashGenerationLockOps(redis);
  const generationBuffer = createUpstashGenerationBufferOps(redis);

  return {
    getMessageRetentionSeconds,
    ...generationLock,
    ...generationBuffer,

    async appendMessage(sessionId, message) {
      const ttl = getMessageRetentionSeconds();
      const timeline = timelineKey(sessionId);
      const msgKey = messageKey(sessionId, message.id);

      await redis
        .multi()
        .zadd(timeline, { score: message.createdAt, member: message.id })
        .set(msgKey, serializeStoredMessage(message), { ex: ttl })
        .expire(timeline, ttl)
        .exec();

      await touchSessionTtlUpstash(redis, sessionId, ttl);
    },

    async getLatestMessages(sessionId, limit) {
      const timeline = timelineKey(sessionId);
      const ids = (await redis.zrange(timeline, 0, limit - 1, {
        rev: true,
      })) as string[];
      const messages = await loadSessionMessages(redis, sessionId, ids);
      const total = (await redis.zcard(timeline)) as number;
      const hasMore = total > limit;
      return withRetention(buildPaginatedResult(messages, hasMore));
    },

    async getMessagesBefore(sessionId, before, limit) {
      const timeline = timelineKey(sessionId);
      // BYSCORE + REV: min must be the high (exclusive) bound, max the low bound —
      // same as ioredis zrevrangebyscore(`(${before}`, "-inf").
      const ids = (await redis.zrange(
        timeline,
        `(${before}`,
        "-inf",
        { byScore: true, rev: true, offset: 0, count: limit },
      )) as string[];
      const messages = await loadSessionMessages(redis, sessionId, ids);
      const olderCount = (await redis.zcount(
        timeline,
        "-inf",
        `(${before}`,
      )) as number;
      const hasMore = olderCount > limit;
      return withRetention(buildPaginatedResult(messages, hasMore));
    },

    async getOpenRouterHistory(sessionId) {
      const timeline = timelineKey(sessionId);
      const ids = (await redis.zrange(timeline, 0, -1)) as string[];
      const messages = await loadSessionMessages(redis, sessionId, ids);
      return messages.map(
        (m): OpenRouterMessage => ({
          role: m.role,
          content: m.content,
        }),
      );
    },
  };
}
