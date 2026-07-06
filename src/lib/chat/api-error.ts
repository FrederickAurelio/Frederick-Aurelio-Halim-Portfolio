import type { ChatErrorCode } from "@/lib/chat/api-errors";

export class ChatApiError extends Error {
  readonly status: number;
  readonly code?: ChatErrorCode;

  constructor(message: string, status: number, code?: ChatErrorCode) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.code = code;
  }
}

export type ParsedChatErrorBody = {
  message: string;
  code?: ChatErrorCode;
};

export function parseChatErrorBody(body: unknown, fallback: string): ParsedChatErrorBody {
  if (!body || typeof body !== "object") {
    return { message: fallback };
  }

  const record = body as {
    error?: string | { message?: string };
    code?: ChatErrorCode;
  };

  if (typeof record.error === "string") {
    return { message: record.error, code: record.code };
  }

  if (record.error && typeof record.error.message === "string") {
    return { message: record.error.message, code: record.code };
  }

  return { message: fallback };
}

export async function parseChatErrorResponse(
  response: Response,
): Promise<ChatApiError> {
  const fallback = `Request failed (${response.status})`;

  try {
    const body = await response.json();
    const { message, code } = parseChatErrorBody(body, fallback);
    return new ChatApiError(message, response.status, code);
  } catch {
    return new ChatApiError(fallback, response.status);
  }
}

export function toNetworkChatApiError(
  error: unknown,
  fallback = "Network request failed",
): ChatApiError {
  if (error instanceof ChatApiError) return error;
  const message = error instanceof Error ? error.message : fallback;
  return new ChatApiError(message, 0);
}
