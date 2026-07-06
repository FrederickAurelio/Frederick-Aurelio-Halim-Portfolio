export type MessageRole = "user" | "assistant" | "error";

export type MessageStatus = "complete" | "streaming" | "error";

export type ChatStreamPhase = "routing" | "retrieving" | "thinking" | "content";

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  reasoning?: string;
  reasoningExpanded?: boolean;
  streamPhase?: ChatStreamPhase;
  status: MessageStatus;
  createdAt: number;
  /** UI-only follow-up chips; not sent to LLMs */
  suggestions?: string[];
};

export type ChatStatus = "idle" | "submitting" | "streaming";

export type ChatApiRequest = {
  content: string;
};

export type StoredMessageStatus = "generating" | "complete";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  createdAt: number;
  status?: StoredMessageStatus;
  streamPhase?: ChatStreamPhase;
  /** UI-only follow-up chips (0–3); not sent to OpenRouter */
  suggestions?: string[];
};

export type GenerationBuffer = {
  userMessageId: string;
  assistantMessageId: string;
  content: string;
  reasoning: string;
  seq: number;
  updatedAt: number;
  streamPhase?: ChatStreamPhase;
};

export type ChatSyncEvent = {
  content: string;
  reasoning: string;
  seq: number;
  streamPhase?: ChatStreamPhase;
};

export const NO_ACTIVE_GENERATION_CODE = "NO_ACTIVE_GENERATION";

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
