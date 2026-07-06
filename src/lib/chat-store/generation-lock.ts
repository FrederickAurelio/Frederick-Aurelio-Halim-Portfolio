import type Redis from "ioredis";
import type { Redis as UpstashRedis } from "@upstash/redis/node";
import {
  GENERATION_LOCK_TTL_SECONDS,
  generationLockKey,
  generationStopKey,
} from "./keys";
import type { GenerationLockOps } from "./types";

const GENERATION_STOP_TTL_SECONDS = 60;

export function createIoredisGenerationLockOps(redis: Redis): GenerationLockOps {
  return {
    async tryAcquireGenerationLock(sessionId, assistantMessageId) {
      const result = await redis.set(
        generationLockKey(sessionId),
        assistantMessageId,
        "EX",
        GENERATION_LOCK_TTL_SECONDS,
        "NX",
      );
      return result === "OK";
    },

    async releaseGenerationLock(sessionId) {
      await redis.del(generationLockKey(sessionId));
    },

    async isGenerationLocked(sessionId) {
      return (await redis.exists(generationLockKey(sessionId))) === 1;
    },

    async requestGenerationStop(sessionId) {
      await redis.set(
        generationStopKey(sessionId),
        "1",
        "EX",
        GENERATION_STOP_TTL_SECONDS,
      );
    },

    async isGenerationStopRequested(sessionId) {
      return (await redis.get(generationStopKey(sessionId))) === "1";
    },

    async clearGenerationStopRequest(sessionId) {
      await redis.del(generationStopKey(sessionId));
    },
  };
}

export function createUpstashGenerationLockOps(
  redis: UpstashRedis,
): GenerationLockOps {
  return {
    async tryAcquireGenerationLock(sessionId, assistantMessageId) {
      const result = await redis.set(generationLockKey(sessionId), assistantMessageId, {
        nx: true,
        ex: GENERATION_LOCK_TTL_SECONDS,
      });
      return result === "OK";
    },

    async releaseGenerationLock(sessionId) {
      await redis.del(generationLockKey(sessionId));
    },

    async isGenerationLocked(sessionId) {
      return ((await redis.exists(generationLockKey(sessionId))) as number) === 1;
    },

    async requestGenerationStop(sessionId) {
      await redis.set(generationStopKey(sessionId), "1", {
        ex: GENERATION_STOP_TTL_SECONDS,
      });
    },

    async isGenerationStopRequested(sessionId) {
      const value = await redis.get(generationStopKey(sessionId));
      return value === "1" || value === 1;
    },

    async clearGenerationStopRequest(sessionId) {
      await redis.del(generationStopKey(sessionId));
    },
  };
}
