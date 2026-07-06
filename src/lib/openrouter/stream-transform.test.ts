import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractThinkingDelta } from "./stream-transform";
import type { OpenRouterStreamChunk } from "./types";

function chunkWithDelta(delta: NonNullable<OpenRouterStreamChunk["choices"]>[0]["delta"]) {
  return [{ delta }] as OpenRouterStreamChunk["choices"];
}

describe("extractThinkingDelta", () => {
  it("uses reasoning_details only when present (no duplicate from aliases)", () => {
    const result = extractThinkingDelta(
      chunkWithDelta({
        reasoning: "We",
        reasoning_content: "We",
        reasoning_details: [{ type: "reasoning.text", text: "We" }],
      }),
    );
    assert.equal(result, "We");
  });

  it("falls back to reasoning_content when no reasoning_details", () => {
    const result = extractThinkingDelta(
      chunkWithDelta({
        reasoning: "need",
        reasoning_content: "need",
      }),
    );
    assert.equal(result, "need");
  });

  it("falls back to reasoning when only reasoning is set", () => {
    const result = extractThinkingDelta(
      chunkWithDelta({
        reasoning: "hello",
      }),
    );
    assert.equal(result, "hello");
  });

  it("returns empty string for missing delta", () => {
    assert.equal(extractThinkingDelta(undefined), "");
    assert.equal(extractThinkingDelta([]), "");
  });
});
