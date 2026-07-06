import type Redis from "ioredis";
import type { Redis as UpstashRedis } from "@upstash/redis/node";
import { timelineKey } from "./keys";

/** Sliding TTL: refresh timeline + every message key in one round trip. */
export const TOUCH_SESSION_LUA = `
local timeline = KEYS[1]
local ttl = tonumber(ARGV[1])
local msgPrefix = ARGV[2]
redis.call('EXPIRE', timeline, ttl)
local ids = redis.call('ZRANGE', timeline, 0, -1)
for _, id in ipairs(ids) do
  redis.call('EXPIRE', msgPrefix .. id, ttl)
end
return #ids
`;

export function sessionMessageKeyPrefix(sessionId: string): string {
  return `chat:${sessionId}:msg:`;
}

export async function touchSessionTtlUpstash(
  redis: UpstashRedis,
  sessionId: string,
  ttl: number,
): Promise<void> {
  await redis.eval(
    TOUCH_SESSION_LUA,
    [timelineKey(sessionId)],
    [String(ttl), sessionMessageKeyPrefix(sessionId)],
  );
}

export async function touchSessionTtlIoredis(
  redis: Redis,
  sessionId: string,
  ttl: number,
): Promise<void> {
  await redis.eval(
    TOUCH_SESSION_LUA,
    1,
    timelineKey(sessionId),
    String(ttl),
    sessionMessageKeyPrefix(sessionId),
  );
}
