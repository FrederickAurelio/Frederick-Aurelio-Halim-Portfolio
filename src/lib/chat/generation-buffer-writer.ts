import type { ChatStore } from "@/lib/chat-store";
import { getGenerationBufferFlushMs } from "@/lib/chat-store/keys";
import type { GenerationBuffer } from "@/lib/chat/types";

type GenerationBufferWriterMeta = {
  userMessageId: string;
  assistantMessageId: string;
};

export class GenerationBufferWriter {
  private content = "";
  private reasoning = "";
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

  appendThinking(delta: string): void {
    if (!delta) return;
    this.reasoning += delta;
    this.scheduleFlush();
  }

  appendContent(delta: string): void {
    if (!delta) return;
    this.content += delta;
    this.scheduleFlush();
  }

  async flushNow(): Promise<void> {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.enqueueWrite();
  }

  async clear(): Promise<void> {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.writeChain;
    await this.store.clearGenerationBuffer(this.sessionId);
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
    };
    await this.store.setGenerationBuffer(this.sessionId, buffer);
  }
}
