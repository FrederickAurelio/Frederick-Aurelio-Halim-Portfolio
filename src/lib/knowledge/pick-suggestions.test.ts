import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  pickSuggestions,
  SUGGESTION_LIMIT_COLD_START,
  SUGGESTION_LIMIT_FOLLOW_UP,
} from "./pick-suggestions";
import { defaultRetrievalPlan } from "./retrieval-plan";

describe("pickSuggestions", () => {
  it("returns at most 2 cold-start items", () => {
    const items = pickSuggestions({
      mode: "cold_start",
      language: "en",
      userMessages: [],
    });
    assert.ok(items.length <= SUGGESTION_LIMIT_COLD_START);
    assert.equal(items.length, SUGGESTION_LIMIT_COLD_START);
  });

  it("cold start only returns the fixed priority list", () => {
    const en = pickSuggestions({
      mode: "cold_start",
      language: "en",
      userMessages: [],
    });
    const ch = pickSuggestions({
      mode: "cold_start",
      language: "ch",
      userMessages: [],
    });
    assert.ok(en[0]?.includes("look at first") || en[0]?.includes("What should"));
    assert.ok(en.some((s) => s.includes("tech stack")));
    assert.ok(ch.some((s) => s.includes("技术栈")));
  });

  it("off_topic returns global redirect chips", () => {
    const items = pickSuggestions({
      mode: "off_topic",
      language: "en",
      userMessages: ["what's the weather today"],
    });
    assert.ok(items.length > 0);
    for (const item of items) {
      const isGlobal =
        item.includes("projects") ||
        item.includes("experience") ||
        item.includes("technologies") ||
        item.includes("项目") ||
        item.includes("工作经历") ||
        item.includes("技术");
      assert.ok(isGlobal, `expected global redirect, got: ${item}`);
    }
  });

  it("fallback returns focus-doc chips when trailer parsing fails", () => {
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
      }),
      userMessages: ["Tell me about FXTrade"],
    });
    assert.ok(items.length <= SUGGESTION_LIMIT_FOLLOW_UP);
    assert.ok(items.some((s) => s.toLowerCase().includes("currency data")));
  });

  it("fallback excludes already-asked question text", () => {
    const asked = "Where does FXTrade get currency data?";
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
      }),
      userMessages: [asked],
    });
    assert.ok(!items.includes(asked));
  });

  it("fallback excludes previously shown chips", () => {
    const shown = "How do the FX charts work?";
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
      }),
      userMessages: ["Tell me about FXTrade"],
      previousSuggestions: [shown],
    });
    assert.ok(!items.includes(shown));
  });

  it("fallback returns nothing when focus doc is empty", () => {
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] }),
      userMessages: ["What's your tech stack?"],
    });
    assert.equal(items.length, 0);
  });

  it("fallback uses focus_doc_ids[0] from navigator plan", () => {
    const asked = "How does real-time multiplayer work?";
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: ["quizconnect", "about-me"],
      }),
      userMessages: [
        "What should I look at first?",
        "How did you set up the CI/CD pipeline?",
        asked,
      ],
    });
    assert.ok(!items.some((s) => s.toLowerCase().includes("background")));
    assert.ok(!items.some((s) => s.toLowerCase().includes("study")));
    assert.ok(
      items.some((s) => s.toLowerCase().includes("hardest")),
      `expected QuizConnect chip, got: ${items.join(", ")}`,
    );
    assert.equal(items.length, 1);
  });

  it("fallback does not spill to secondary focus docs", () => {
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: ["quizconnect", "about-me"],
      }),
      userMessages: ["How does real-time multiplayer work?"],
      previousSuggestions: ["What was the hardest part of QuizConnect?"],
    });
    assert.equal(items.length, 0);
  });

  it("fallback keeps bio chips when about-me is the only focus", () => {
    const items = pickSuggestions({
      mode: "fallback",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "bio",
        focus_doc_ids: ["about-me"],
      }),
      userMessages: ["Who are you?"],
    });
    assert.ok(items.some((s) => s.toLowerCase().includes("background")));
  });

  it("bank stays curated (not bloated)", async () => {
    const { SUGGESTION_BANK_SIZE } = await import("./suggestion-bank");
    assert.ok(SUGGESTION_BANK_SIZE >= 18 && SUGGESTION_BANK_SIZE <= 30);
  });
});
