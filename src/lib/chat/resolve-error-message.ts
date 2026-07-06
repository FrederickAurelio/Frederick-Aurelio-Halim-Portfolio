import { CHAT_ERROR_CODES, type ChatErrorCode } from "@/lib/chat/api-errors";
import { GENERATION_IN_PROGRESS_CODE } from "@/lib/chat/types";

export type ChatErrorMessages = {
  notConfigured: string;
  storageUnavailable: string;
  unauthorized: string;
  generic: string;
  generating: string;
};

export function resolveChatErrorMessage(
  messages: ChatErrorMessages,
  options: {
    code?: ChatErrorCode;
    message?: string;
    status?: number;
  },
): string {
  const { code, message = "", status } = options;
  const lower = message.toLowerCase();

  switch (code) {
    case CHAT_ERROR_CODES.NOT_CONFIGURED:
      return messages.notConfigured;
    case CHAT_ERROR_CODES.STORAGE_UNAVAILABLE:
      return messages.storageUnavailable;
    case CHAT_ERROR_CODES.UNAUTHORIZED:
      return messages.unauthorized;
    case CHAT_ERROR_CODES.GENERATION_IN_PROGRESS:
      return messages.generating;
    case CHAT_ERROR_CODES.GENERIC:
      return messages.generic;
    default:
      break;
  }

  if (message === GENERATION_IN_PROGRESS_CODE || status === 409) {
    return messages.generating;
  }

  if (status === 401 || lower.includes("unauthorized")) {
    return messages.unauthorized;
  }

  if (
    status === 503 &&
    (lower.includes("storage") ||
      lower.includes("redis") ||
      lower.includes("upstash"))
  ) {
    return messages.storageUnavailable;
  }

  if (lower.includes("not configured")) {
    return messages.notConfigured;
  }

  return message.trim() || messages.generic;
}
