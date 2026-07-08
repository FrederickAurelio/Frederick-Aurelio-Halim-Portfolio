import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createParser } from "eventsource-parser";

import type { ChatStore } from "@/lib/chat-store";
import type { GenerationBuffer } from "@/lib/chat/types";
import { createGenerationSubscribeStream } from "./generation-subscribe-stream";

function createMockStore(options: {
  buffer: GenerationBuffer | null;
  lockedSequence: boolean[];
}): ChatStore {
  let lockIndex = 0;

  return {
    isGenerationLocked: async () => {
      const locked = options.lockedSequence[lockIndex] ?? false;
      lockIndex += 1;
      return locked;
    },
    getGenerationBuffer: async () => options.buffer,
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
  it("replays buffer suggestions before done when generation finishes", async () => {
    const buffer: GenerationBuffer = {
      userMessageId: "user-1",
      assistantMessageId: "assistant-1",
      content: "FXTrade is a dashboard.",
      reasoning: "",
      seq: 1,
      updatedAt: Date.now(),
      streamPhase: "content",
      suggestions: ["Where does data come from?"],
    };

    const store = createMockStore({
      buffer,
      lockedSequence: [true, false],
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
