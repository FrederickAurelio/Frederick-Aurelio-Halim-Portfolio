import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ChatMessage } from "@/lib/chat/types";
import { resolveDisplaySuggestions } from "./resolve-display-suggestions";

describe("resolveDisplaySuggestions", () => {
  it("returns cold-start chips when the chat is empty", () => {
    assert.deepEqual(
      resolveDisplaySuggestions([], false, [
        "What should I look at first?",
        "What's your tech stack?",
      ]),
      ["What should I look at first?", "What's your tech stack?"],
    );
  });

  it("returns assistant trailer chips after a reply", () => {
    const messages: ChatMessage[] = [
      {
        id: "assistant-1",
        role: "assistant",
        content: "FXTrade is a forex simulator.",
        status: "complete",
        createdAt: 1,
        suggestions: ["Where does the data come from?"],
      },
    ];

    assert.deepEqual(
      resolveDisplaySuggestions(messages, false, ["Cold start"]),
      ["Where does the data come from?"],
    );
  });

  it("does not fall back to cold-start chips mid-conversation", () => {
    const messages: ChatMessage[] = [
      {
        id: "assistant-1",
        role: "assistant",
        content: "FXTrade is a forex simulator.",
        status: "complete",
        createdAt: 1,
      },
    ];

    assert.deepEqual(
      resolveDisplaySuggestions(messages, false, ["Cold start"]),
      [],
    );
  });
});
