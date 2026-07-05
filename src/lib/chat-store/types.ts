import type { OpenRouterMessage } from "@/lib/openrouter/types";
import type { PaginatedMessages, StoredChatMessage } from "@/lib/chat/types";

export type { PaginatedMessages, StoredChatMessage };

export type GenerationLockOps = {
  tryAcquireGenerationLock(
    sessionId: string,
    assistantMessageId: string,
  ): Promise<boolean>;
  releaseGenerationLock(sessionId: string): Promise<void>;
  isGenerationLocked(sessionId: string): Promise<boolean>;
  requestGenerationStop(sessionId: string): Promise<void>;
  isGenerationStopRequested(sessionId: string): Promise<boolean>;
  clearGenerationStopRequest(sessionId: string): Promise<void>;
};

export interface ChatStore extends GenerationLockOps {
  appendMessage(sessionId: string, message: StoredChatMessage): Promise<void>;
  getLatestMessages(sessionId: string, limit: number): Promise<PaginatedMessages>;
  getMessagesBefore(
    sessionId: string,
    before: number,
    limit: number,
  ): Promise<PaginatedMessages>;
  getOpenRouterHistory(sessionId: string): Promise<OpenRouterMessage[]>;
  getMessageRetentionSeconds(): number;
}
