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
import type { ChatStore, PaginatedMessages } from "./types";

let client: Redis | null = null;

function getUpstashClient(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error("Upstash Redis is not configured");
    }
    client = new Redis({ url, token });
  }
  return client;
}

async function touchSession(redis: Redis, sessionId: string, ttl: number) {
  const timeline = timelineKey(sessionId);
  const ids = (await redis.zrange(timeline, 0, -1)) as string[];
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
        .set(msgKey, serializeStoredMessage(message))
        .exec();

      await touchSession(redis, sessionId, ttl);
    },

    async getLatestMessages(sessionId, limit) {
      const timeline = timelineKey(sessionId);
      const ids = (await redis.zrange(timeline, 0, limit - 1, {
        rev: true,
      })) as string[];
      const messages = await loadMessagesByIds(
        (id) => redis.get<string>(messageKey(sessionId, id)),
        ids,
      );
      const total = (await redis.zcard(timeline)) as number;
      const hasMore = total > limit;
      return withRetention(buildPaginatedResult(messages, hasMore));
    },

    async getMessagesBefore(sessionId, before, limit) {
      const timeline = timelineKey(sessionId);
      const ids = (await redis.zrange(
        timeline,
        "-inf",
        `(${before}`,
        { byScore: true, rev: true, offset: 0, count: limit },
      )) as string[];
      const messages = await loadMessagesByIds(
        (id) => redis.get<string>(messageKey(sessionId, id)),
        ids,
      );
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
      const messages = await loadMessagesByIds(
        (id) => redis.get<string>(messageKey(sessionId, id)),
        ids,
      );
      return messages.map(
        (m): OpenRouterMessage => ({
          role: m.role,
          content: m.content,
        }),
      );
    },
  };
}
