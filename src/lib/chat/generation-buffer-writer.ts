import type { ChatStore } from "@/lib/chat-store";
import {
  GENERATION_BUFFER_CLEAR_DELAY_MS,
  getGenerationBufferFlushMs,
} from "@/lib/chat-store/keys";
import type { ChatStreamPhase, GenerationBuffer } from "@/lib/chat/types";

type GenerationBufferWriterMeta = {
  userMessageId: string;
  assistantMessageId: string;
};

export class GenerationBufferWriter {
  private content = "";
  private reasoning = "";
  private suggestions: string[] | undefined;
  private streamPhase: ChatStreamPhase | undefined;
  private seq = 0;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private writeChain: Promise<void> = Promise.resolve();
  private readonly flushMs: number;

  constructor(
    private readonly sessionId: string,
    private readonly meta: GenerationBufferWriterMeta,
    private readonly store: ChatStore,
    flushMs = getGenerationBufferFlushMs(),
  ) {
    this.flushMs = flushMs;
  }

  getContent(): string {
    return this.content;
  }

  getReasoning(): string {
    return this.reasoning;
  }

  async init(): Promise<void> {
    await this.store.initGenerationBuffer(this.sessionId, this.meta);
  }

  setStreamPhase(phase: ChatStreamPhase): void {
    if (this.streamPhase === phase) return;
    this.streamPhase = phase;
    if (phase === "routing" || phase === "retrieving" || phase === "thinking") {
      void this.flushNow();
      return;
    }
    this.scheduleFlush();
  }

  appendThinking(delta: string): void {
    if (!delta) return;
    this.reasoning += delta;
    if (this.streamPhase !== "content") {
      this.streamPhase = "thinking";
    }
    this.scheduleFlush();
  }

  appendContent(delta: string): void {
    if (!delta) return;
    this.content += delta;
    this.streamPhase = "content";
    this.scheduleFlush();
  }

  setSuggestions(items: string[]): void {
    this.suggestions = items.length > 0 ? items : undefined;
    void this.flushNow();
  }

  async flushNow(): Promise<void> {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.enqueueWrite();
  }

  /** Drop Redis buffer after a grace period (GET reconnect reads final state). */
  scheduleDeferredClear(
    delayMs: number = GENERATION_BUFFER_CLEAR_DELAY_MS,
  ): void {
    void this.deferredClear(delayMs);
  }

  private async deferredClear(delayMs: number): Promise<void> {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.writeChain;
    setTimeout(() => {
      void this.store.clearGenerationBuffer(this.sessionId).catch(() => {});
    }, delayMs);
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.enqueueWrite();
    }, this.flushMs);
  }

  private enqueueWrite(): Promise<void> {
    const write = this.writeChain.then(() => this.persistBuffer());
    this.writeChain = write.catch(() => {});
    return write;
  }

  private async persistBuffer(): Promise<void> {
    this.seq += 1;
    const buffer: GenerationBuffer = {
      userMessageId: this.meta.userMessageId,
      assistantMessageId: this.meta.assistantMessageId,
      content: this.content,
      reasoning: this.reasoning,
      seq: this.seq,
      updatedAt: Date.now(),
      streamPhase: this.streamPhase,
      suggestions: this.suggestions,
    };
    await this.store.setGenerationBuffer(this.sessionId, buffer);
  }
}
