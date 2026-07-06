import Redis from "ioredis";
import type { OpenRouterMessage } from "@/lib/openrouter/types";
import {
  buildPaginatedResult,
  getMessageRetentionSeconds,
  loadMessagesByIds,
  messageKey,
  serializeStoredMessage,
  timelineKey,
} from "./keys";
import { createIoredisGenerationLockOps } from "./generation-lock";
import { createIoredisGenerationBufferOps } from "./generation-buffer";
import type { ChatStore, PaginatedMessages } from "./types";

let client: Redis | null = null;

function getRedisClient(): Redis {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error("REDIS_URL is not configured");
    }
    client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
  }
  return client;
}

async function touchSession(redis: Redis, sessionId: string, ttl: number) {
  const timeline = timelineKey(sessionId);
  const ids = await redis.zrange(timeline, 0, -1);
  const pipeline = redis.pipeline();
  pipeline.expire(timeline, ttl);
  for (const id of ids) {
    pipeline.expire(messageKey(sessionId, id), ttl);
  }
  await pipeline.exec();
}

function withRetention(
  result: Omit<PaginatedMessages, "retentionSeconds">,
): PaginatedMessages {
  return { ...result, retentionSeconds: getMessageRetentionSeconds() };
}

export function createRedisChatStore(): ChatStore {
  const redis = getRedisClient();
  const generationLock = createIoredisGenerationLockOps(redis);
  const generationBuffer = createIoredisGenerationBufferOps(redis);

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
        .zadd(timeline, message.createdAt, message.id)
        .set(msgKey, serializeStoredMessage(message))
        .exec();

      await touchSession(redis, sessionId, ttl);
    },

    async getLatestMessages(sessionId, limit) {
      const timeline = timelineKey(sessionId);
      const ids = await redis.zrevrange(timeline, 0, limit - 1);
      const messages = await loadMessagesByIds(
        (id) => redis.get(messageKey(sessionId, id)),
        ids,
      );
      const total = await redis.zcard(timeline);
      const hasMore = total > limit;
      return withRetention(buildPaginatedResult(messages, hasMore));
    },

    async getMessagesBefore(sessionId, before, limit) {
      const timeline = timelineKey(sessionId);
      const ids = await redis.zrevrangebyscore(
        timeline,
        `(${before}`,
        "-inf",
        "LIMIT",
        0,
        limit,
      );
      const messages = await loadMessagesByIds(
        (id) => redis.get(messageKey(sessionId, id)),
        ids,
      );
      const olderCount = await redis.zcount(timeline, "-inf", `(${before}`);
      const hasMore = olderCount > limit;
      return withRetention(buildPaginatedResult(messages, hasMore));
    },

    async getOpenRouterHistory(sessionId) {
      const timeline = timelineKey(sessionId);
      const ids = await redis.zrange(timeline, 0, -1);
      const messages = await loadMessagesByIds(
        (id) => redis.get(messageKey(sessionId, id)),
        ids,
      );
      // Only role+content go to OpenRouter; metadata (suggestions, reasoning) stays client-side.
      return messages.map(
        (m): OpenRouterMessage => ({
          role: m.role,
          content: m.content,
        }),
      );
    },
  };
}
