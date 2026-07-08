import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  emitChatPhase,
  emitContentDelta,
  emitSuggestions,
  safeEnqueue,
} from "./sse";

async function collectSseEvents(
  fn: (
    controller: ReadableStreamDefaultController<Uint8Array>,
    encoder: TextEncoder,
  ) => void,
): Promise<Array<{ event: string; data: unknown }>> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      fn(controller, encoder);
      controller.close();
    },
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  buffer = decoder.decode(Buffer.concat(chunks));

  const events: Array<{ event: string; data: unknown }> = [];
  for (const block of buffer.split("\n\n")) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const lines = trimmed.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event: "));
    const dataLine = lines.find((line) => line.startsWith("data: "));
    if (!eventLine || !dataLine) continue;
    events.push({
      event: eventLine.slice("event: ".length),
      data: JSON.parse(dataLine.slice("data: ".length)),
    });
  }

  return events;
}

describe("emitChatPhase", () => {
  it("emits routing named event and phase for routing", async () => {
    const events = await collectSseEvents((controller, encoder) => {
      emitChatPhase(controller, encoder, "routing");
    });

    assert.deepEqual(
      events.map((entry) => entry.event),
      ["routing", "phase"],
    );
    assert.deepEqual(events[1].data, { phase: "routing" });
  });

  it("emits only phase for thinking", async () => {
    const events = await collectSseEvents((controller, encoder) => {
      emitChatPhase(controller, encoder, "thinking");
    });

    assert.deepEqual(events.map((entry) => entry.event), ["phase"]);
    assert.deepEqual(events[0].data, { phase: "thinking" });
  });

  it("skips when phase is undefined", async () => {
    const events = await collectSseEvents((controller, encoder) => {
      emitChatPhase(controller, encoder, undefined);
    });

    assert.equal(events.length, 0);
  });
});

describe("emitContentDelta", () => {
  it("encodes content delta SSE", async () => {
    const events = await collectSseEvents((controller, encoder) => {
      emitContentDelta(controller, encoder, "hello");
    });

    assert.equal(events[0].event, "content");
    assert.deepEqual(events[0].data, { delta: "hello" });
  });
});

describe("emitSuggestions", () => {
  it("encodes suggestions SSE", async () => {
    const events = await collectSseEvents((controller, encoder) => {
      emitSuggestions(controller, encoder, ["Chip one"]);
    });

    assert.equal(events[0].event, "suggestions");
    assert.deepEqual(events[0].data, { items: ["Chip one"] });
  });
});

describe("safeEnqueue", () => {
  it("encodes arbitrary event and data", async () => {
    const events = await collectSseEvents((controller, encoder) => {
      safeEnqueue(controller, encoder, "done", { ok: true });
    });

    assert.equal(events[0].event, "done");
    assert.deepEqual(events[0].data, { ok: true });
  });
});
