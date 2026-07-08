import type { OpenRouterMessage } from "@/lib/openrouter/types";
import type { SessionRoutingState } from "@/lib/knowledge/session-routing-state";
import type {
  GenerationBuffer,
  PaginatedMessages,
  StoredChatMessage,
} from "@/lib/chat/types";

export type { GenerationBuffer, PaginatedMessages, StoredChatMessage };

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

export type GenerationBufferOps = {
  initGenerationBuffer(
    sessionId: string,
    data: Pick<GenerationBuffer, "userMessageId" | "assistantMessageId">,
  ): Promise<void>;
  setGenerationBuffer(sessionId: string, buffer: GenerationBuffer): Promise<void>;
  getGenerationBuffer(sessionId: string): Promise<GenerationBuffer | null>;
  clearGenerationBuffer(sessionId: string): Promise<void>;
  getGenerationLockAssistantId(sessionId: string): Promise<string | null>;
};

export interface ChatStore extends GenerationLockOps, GenerationBufferOps {
  appendMessage(sessionId: string, message: StoredChatMessage): Promise<void>;
  getLatestMessages(sessionId: string, limit: number): Promise<PaginatedMessages>;
  getMessagesBefore(
    sessionId: string,
    before: number,
    limit: number,
  ): Promise<PaginatedMessages>;
  getOpenRouterHistory(sessionId: string): Promise<OpenRouterMessage[]>;
  getSessionRoutingState(sessionId: string): Promise<SessionRoutingState>;
  setSessionRoutingState(
    sessionId: string,
    state: SessionRoutingState,
  ): Promise<void>;
  getMessageRetentionSeconds(): number;
}
