/** Thrown by chat-store operations so route error mapping stays precise. */
export class ChatStorageError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ChatStorageError";
  }
}

export function toChatStorageError(error: unknown, fallback: string): ChatStorageError {
  if (error instanceof ChatStorageError) return error;
  if (error instanceof Error) {
    return new ChatStorageError(error.message, { cause: error });
  }
  return new ChatStorageError(fallback, { cause: error });
}
