export type MessageRole = "user" | "assistant" | "error";

export type MessageStatus = "complete" | "streaming" | "error";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  reasoning?: string;
  reasoningExpanded?: boolean;
  status: MessageStatus;
  createdAt: number;
};

export type ChatStatus = "idle" | "submitting" | "streaming";

export type ChatApiRequest = {
  content: string;
};

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  createdAt: number;
};

export type ChatMessagesPage = {
  messages: StoredChatMessage[];
  nextCursor: number | null;
  retentionSeconds: number;
};

export type PaginatedMessages = ChatMessagesPage;

export type ChatSavedEvent = {
  userMessageId: string;
  assistantMessageId: string;
};

export const GENERATION_IN_PROGRESS_CODE = "GENERATION_IN_PROGRESS";
