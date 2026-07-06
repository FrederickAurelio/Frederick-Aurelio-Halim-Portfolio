export const CHAT_ERROR_CODES = {
  NOT_CONFIGURED: "CHAT_NOT_CONFIGURED",
  STORAGE_UNAVAILABLE: "CHAT_STORAGE_UNAVAILABLE",
  UNAUTHORIZED: "CHAT_UNAUTHORIZED",
  GENERATION_IN_PROGRESS: "GENERATION_IN_PROGRESS",
  GENERIC: "CHAT_GENERIC",
} as const;

export type ChatErrorCode =
  (typeof CHAT_ERROR_CODES)[keyof typeof CHAT_ERROR_CODES];

export type ChatErrorBody = {
  error: string;
  code: ChatErrorCode;
};
