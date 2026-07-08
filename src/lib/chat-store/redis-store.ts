import Redis from "ioredis";
import type { OpenRouterMessage } from "@/lib/openrouter/types";
import {
  EMPTY_SESSION_ROUTING_STATE,
  parseSessionRoutingState,
  serializeSessionRoutingState,
} from "@/lib/knowledge/session-routing-state";
import {
  buildPaginatedResult,
  getMessageRetentionSeconds,
  loadMessagesByIds,
  messageKey,
  routingStateKey,
  serializeStoredMessage,
  timelineKey,
} from "./keys";
import { createIoredisGenerationLockOps } from "./generation-lock";
import { createIoredisGenerationBufferOps } from "./generation-buffer";
import { touchSessionTtlIoredis } from "./touch-session";
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

function withRetention(
  result: Omit<PaginatedMessages, "retentionSeconds">,
): PaginatedMessages {
  return { ...result, retentionSeconds: getMessageRetentionSeconds() };
}

function loadSessionMessages(redis: Redis, sessionId: string, ids: string[]) {
  return loadMessagesByIds(ids, async (messageIds) => {
    if (messageIds.length === 0) return [];
    const keys = messageIds.map((id) => messageKey(sessionId, id));
    return redis.mget(...keys);
  });
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
        .set(msgKey, serializeStoredMessage(message), "EX", ttl)
        .expire(timeline, ttl)
        .exec();

      await touchSessionTtlIoredis(redis, sessionId, ttl);
    },

    async getLatestMessages(sessionId, limit) {
      const timeline = timelineKey(sessionId);
      const ids = await redis.zrevrange(timeline, 0, limit - 1);
      const messages = await loadSessionMessages(redis, sessionId, ids);
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
      const messages = await loadSessionMessages(redis, sessionId, ids);
      const olderCount = await redis.zcount(timeline, "-inf", `(${before}`);
      const hasMore = olderCount > limit;
      return withRetention(buildPaginatedResult(messages, hasMore));
    },

    async getOpenRouterHistory(sessionId) {
      const timeline = timelineKey(sessionId);
      const ids = await redis.zrange(timeline, 0, -1);
      const messages = await loadSessionMessages(redis, sessionId, ids);
      return messages.map(
        (m): OpenRouterMessage => ({
          role: m.role,
          content: m.content,
        }),
      );
    },

    async getRecentShownSuggestions(sessionId, maxAssistantTurns = 5) {
      const timeline = timelineKey(sessionId);
      const ids = await redis.zrevrange(timeline, 0, 49);
      const messages = await loadSessionMessages(redis, sessionId, ids);
      const suggestions: string[] = [];
      let assistantTurns = 0;

      for (const message of messages) {
        if (message.role !== "assistant") continue;
        if (message.suggestions?.length) {
          suggestions.push(...message.suggestions);
          assistantTurns += 1;
          if (assistantTurns >= maxAssistantTurns) break;
        }
      }

      return suggestions;
    },

    async getSessionRoutingState(sessionId) {
      const raw = await redis.get(routingStateKey(sessionId));
      if (!raw) return { ...EMPTY_SESSION_ROUTING_STATE };
      try {
        return parseSessionRoutingState(JSON.parse(raw));
      } catch {
        return { ...EMPTY_SESSION_ROUTING_STATE };
      }
    },

    async setSessionRoutingState(sessionId, state) {
      const ttl = getMessageRetentionSeconds();
      await redis.set(
        routingStateKey(sessionId),
        serializeSessionRoutingState(state),
        "EX",
        ttl,
      );
    },
  };
}
