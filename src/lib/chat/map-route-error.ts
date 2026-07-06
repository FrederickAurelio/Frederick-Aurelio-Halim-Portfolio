import { SessionError } from "@/lib/chat/session";
import { CHAT_ERROR_CODES, type ChatErrorBody } from "@/lib/chat/api-errors";
import { ChatStorageError } from "@/lib/chat-store/storage-error";
import { GENERATION_IN_PROGRESS_CODE } from "@/lib/chat/types";

export type MappedChatRouteError = {
  status: number;
  body: ChatErrorBody;
};

function isStorageConfigError(error: Error): boolean {
  return (
    error.message === "Upstash Redis is not configured" ||
    error.message === "REDIS_URL is not configured"
  );
}

function isStorageRuntimeError(error: Error): boolean {
  if (error instanceof ChatStorageError) return true;

  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();

  if (name === "upstasherror") return true;

  if (message.includes("upstash")) return true;

  return (
    message.includes("redis connection") ||
    message.includes("redis connect") ||
    (message.includes("redis") &&
      (message.includes("econnrefused") ||
        message.includes("enotfound") ||
        message.includes("etimedout") ||
        message.includes("connection refused")))
  );
}

export function mapChatRouteError(error: unknown): MappedChatRouteError {
  if (error instanceof SessionError) {
    return {
      status: 401,
      body: {
        error: "Unauthorized",
        code: CHAT_ERROR_CODES.UNAUTHORIZED,
      },
    };
  }

  if (error instanceof Error) {
    if (error.message === "OPENROUTER_NOT_CONFIGURED") {
      return {
        status: 503,
        body: {
          error: "Chat is not configured",
          code: CHAT_ERROR_CODES.NOT_CONFIGURED,
        },
      };
    }

    if (error.message === GENERATION_IN_PROGRESS_CODE) {
      return {
        status: 409,
        body: {
          error: GENERATION_IN_PROGRESS_CODE,
          code: CHAT_ERROR_CODES.GENERATION_IN_PROGRESS,
        },
      };
    }

    if (isStorageConfigError(error)) {
      return {
        status: 503,
        body: {
          error: "Chat storage is not configured",
          code: CHAT_ERROR_CODES.STORAGE_UNAVAILABLE,
        },
      };
    }

    if (isStorageRuntimeError(error)) {
      return {
        status: 503,
        body: {
          error: "Chat storage is temporarily unavailable",
          code: CHAT_ERROR_CODES.STORAGE_UNAVAILABLE,
        },
      };
    }
  }

  return {
    status: 500,
    body: {
      error: "Something went wrong",
      code: CHAT_ERROR_CODES.GENERIC,
    },
  };
}
