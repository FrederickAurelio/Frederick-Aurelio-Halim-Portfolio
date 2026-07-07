import type { StoredChatMessage } from "./types";

const DEFAULT_MESSAGE_TTL_SECONDS = 60 * 60 * 6; // 6 hours
/** Safety TTL if generation never finishes (stop/crash). */
export const GENERATION_LOCK_TTL_SECONDS = 60 * 5; // 5 minutes

export function getMessageRetentionSeconds(): number {
  const raw = process.env.CHAT_MESSAGE_TTL_SECONDS;
  if (!raw) return DEFAULT_MESSAGE_TTL_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MESSAGE_TTL_SECONDS;
  return parsed;
}

export function timelineKey(sessionId: string): string {
  return `chat:${sessionId}:timeline`;
}

export function messageKey(sessionId: string, messageId: string): string {
  return `chat:${sessionId}:msg:${messageId}`;
}

export function generationLockKey(sessionId: string): string {
  return `chat:${sessionId}:gen:lock`;
}

export function generationStopKey(sessionId: string): string {
  return `chat:${sessionId}:gen:stop`;
}

export function generationBufferKey(sessionId: string): string {
  return `chat:${sessionId}:gen:buffer`;
}

export function routingStateKey(sessionId: string): string {
  return `chat:${sessionId}:routing`;
}

export function getGenerationBufferFlushMs(): number {
  const raw = process.env.CHAT_GEN_BUFFER_FLUSH_MS;
  if (!raw) return 200;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 200;
  return parsed;
}

export function getGenerationBufferPollMs(): number {
  const raw = process.env.CHAT_GEN_BUFFER_POLL_MS;
  if (!raw) return 200;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 200;
  return parsed;
}

function normalizeStoredMessagePayload(raw: unknown): StoredChatMessage | null {
  if (raw == null) return null;
  try {
    const parsed = (
      typeof raw === "string" ? JSON.parse(raw) : raw
    ) as StoredChatMessage;
    if (
      typeof parsed.id === "string" &&
      (parsed.role === "user" || parsed.role === "assistant") &&
      typeof parsed.content === "string" &&
      typeof parsed.createdAt === "number"
    ) {
      if (parsed.suggestions !== undefined) {
        if (!Array.isArray(parsed.suggestions)) {
          delete parsed.suggestions;
        } else {
          const cleaned = parsed.suggestions
            .filter((s): s is string => typeof s === "string")
            .slice(0, 3);
          if (cleaned.length > 0) {
            parsed.suggestions = cleaned;
          } else {
            delete parsed.suggestions;
          }
        }
      }
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/** Accepts a JSON string (ioredis / Upstash with auto-deser off) or a pre-parsed object. */
export function parseStoredMessage(raw: unknown): StoredChatMessage | null {
  return normalizeStoredMessagePayload(raw);
}

export function serializeStoredMessage(message: StoredChatMessage): string {
  return JSON.stringify(message);
}

export async function loadMessagesByIds(
  ids: string[],
  loadRaw: (ids: string[]) => Promise<unknown[]>,
): Promise<StoredChatMessage[]> {
  if (ids.length === 0) return [];

  const raws = await loadRaw(ids);
  const messages: StoredChatMessage[] = [];
  for (const raw of raws) {
    const message = parseStoredMessage(raw);
    if (message) messages.push(message);
  }
  return messages;
}

export function sortNewestFirst(messages: StoredChatMessage[]): StoredChatMessage[] {
  return [...messages].sort((a, b) => b.createdAt - a.createdAt);
}

/** API pages: index 0 = newest. Cursor points at the oldest item in the page. */
export function buildPaginatedResult(
  messages: StoredChatMessage[],
  hasMore: boolean,
): { messages: StoredChatMessage[]; nextCursor: number | null } {
  const sorted = sortNewestFirst(messages);
  const oldestInBatch = sorted.at(-1);
  const nextCursor =
    hasMore && oldestInBatch ? oldestInBatch.createdAt : null;
  return { messages: sorted, nextCursor };
}
