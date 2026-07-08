import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createParser } from "eventsource-parser";

import type { ChatStore } from "@/lib/chat-store";
import type { GenerationBuffer, PaginatedMessages } from "@/lib/chat/types";
import { createGenerationSubscribeStream } from "./generation-subscribe-stream";

function createMockStore(options: {
  buffer: GenerationBuffer | null;
  lockedSequence: boolean[];
  latestMessages: PaginatedMessages;
}): ChatStore {
  let lockIndex = 0;
  let buffer = options.buffer;

  return {
    isGenerationLocked: async () => {
      const locked = options.lockedSequence[lockIndex] ?? false;
      lockIndex += 1;
      return locked;
    },
    getGenerationBuffer: async () => buffer,
    getLatestMessages: async () => options.latestMessages,
  } as unknown as ChatStore;
}

async function readSubscribeEvents(
  stream: ReadableStream<Uint8Array>,
): Promise<Array<{ event: string; data: unknown }>> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events: Array<{ event: string; data: unknown }> = [];

  await new Promise<void>((resolve, reject) => {
    const parser = createParser({
      onEvent(event) {
        if (!event.event || !event.data) return;
        events.push({
          event: event.event,
          data: JSON.parse(event.data),
        });
      },
    });

    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }
        parser.feed(decoder.decode());
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    void pump();
  });

  return events;
}

describe("createGenerationSubscribeStream", () => {
  it("replays persisted suggestions before done when generation finishes", async () => {
    const assistantMessageId = "assistant-1";
    const buffer: GenerationBuffer = {
      userMessageId: "user-1",
      assistantMessageId,
      content: "FXTrade is a dashboard.",
      reasoning: "",
      seq: 1,
      updatedAt: Date.now(),
      streamPhase: "content",
    };

    const store = createMockStore({
      buffer,
      lockedSequence: [true, false],
      latestMessages: {
        messages: [
          {
            id: assistantMessageId,
            role: "assistant",
            content: "FXTrade is a dashboard.",
            createdAt: Date.now(),
            suggestions: ["Where does data come from?"],
          },
        ],
        nextCursor: null,
        retentionSeconds: 21_600,
      },
    });

    const stream = createGenerationSubscribeStream({
      sessionId: "session-1",
      store,
      pollMs: 1,
    });

    const events = await readSubscribeEvents(stream);
    const eventNames = events.map((entry) => entry.event);

    assert.ok(eventNames.includes("suggestions"));
    assert.ok(eventNames.includes("done"));
    assert.equal(eventNames.at(-1), "done");
    assert.deepEqual(
      events.find((entry) => entry.event === "suggestions")?.data,
      { items: ["Where does data come from?"] },
    );
  });
});
