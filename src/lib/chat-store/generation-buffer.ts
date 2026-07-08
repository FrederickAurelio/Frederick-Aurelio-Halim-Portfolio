import type Redis from "ioredis";
import type { Redis as UpstashRedis } from "@upstash/redis/node";
import type { GenerationBuffer } from "@/lib/chat/types";
import {
  GENERATION_LOCK_TTL_SECONDS,
  generationBufferKey,
  generationLockKey,
} from "./keys";
import type { GenerationBufferOps } from "./types";

function parseGenerationBuffer(raw: unknown): GenerationBuffer | null {
  if (raw == null) return null;
  try {
    const parsed = (
      typeof raw === "string" ? JSON.parse(raw) : raw
    ) as GenerationBuffer;
    if (
      typeof parsed.userMessageId === "string" &&
      typeof parsed.assistantMessageId === "string" &&
      typeof parsed.content === "string" &&
      typeof parsed.reasoning === "string" &&
      typeof parsed.seq === "number" &&
      typeof parsed.updatedAt === "number"
    ) {
      if (parsed.suggestions !== undefined) {
        if (!Array.isArray(parsed.suggestions)) {
          delete parsed.suggestions;
        } else {
          const cleaned = parsed.suggestions.filter(
            (item): item is string => typeof item === "string" && item.trim().length > 0,
          );
          if (cleaned.length > 0) parsed.suggestions = cleaned;
          else delete parsed.suggestions;
        }
      }
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function serializeGenerationBuffer(buffer: GenerationBuffer): string {
  return JSON.stringify(buffer);
}

export function createIoredisGenerationBufferOps(redis: Redis): GenerationBufferOps {
  return {
    async initGenerationBuffer(sessionId, data) {
      await redis.del(generationBufferKey(sessionId));
      const buffer: GenerationBuffer = {
        userMessageId: data.userMessageId,
        assistantMessageId: data.assistantMessageId,
        content: "",
        reasoning: "",
        seq: 0,
        updatedAt: Date.now(),
      };
      await redis.set(
        generationBufferKey(sessionId),
        serializeGenerationBuffer(buffer),
        "EX",
        GENERATION_LOCK_TTL_SECONDS,
      );
    },

    async setGenerationBuffer(sessionId, buffer) {
      await redis.set(
        generationBufferKey(sessionId),
        serializeGenerationBuffer(buffer),
        "EX",
        GENERATION_LOCK_TTL_SECONDS,
      );
    },

    async getGenerationBuffer(sessionId) {
      const raw = await redis.get(generationBufferKey(sessionId));
      return parseGenerationBuffer(raw);
    },

    async clearGenerationBuffer(sessionId) {
      await redis.del(generationBufferKey(sessionId));
    },

    async getGenerationLockAssistantId(sessionId) {
      const value = await redis.get(generationLockKey(sessionId));
      return typeof value === "string" ? value : null;
    },
  };
}

export function createUpstashGenerationBufferOps(
  redis: UpstashRedis,
): GenerationBufferOps {
  return {
    async initGenerationBuffer(sessionId, data) {
      await redis.del(generationBufferKey(sessionId));
      const buffer: GenerationBuffer = {
        userMessageId: data.userMessageId,
        assistantMessageId: data.assistantMessageId,
        content: "",
        reasoning: "",
        seq: 0,
        updatedAt: Date.now(),
      };
      await redis.set(generationBufferKey(sessionId), serializeGenerationBuffer(buffer), {
        ex: GENERATION_LOCK_TTL_SECONDS,
      });
    },

    async setGenerationBuffer(sessionId, buffer) {
      await redis.set(generationBufferKey(sessionId), serializeGenerationBuffer(buffer), {
        ex: GENERATION_LOCK_TTL_SECONDS,
      });
    },

    async getGenerationBuffer(sessionId) {
      const raw = await redis.get<string>(generationBufferKey(sessionId));
      return parseGenerationBuffer(raw);
    },

    async clearGenerationBuffer(sessionId) {
      await redis.del(generationBufferKey(sessionId));
    },

    async getGenerationLockAssistantId(sessionId) {
      const value = await redis.get<string>(generationLockKey(sessionId));
      return value != null ? String(value) : null;
    },
  };
}
