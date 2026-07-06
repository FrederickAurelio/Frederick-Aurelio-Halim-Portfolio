import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  pickSuggestions,
  SUGGESTION_LIMIT_COLD_START,
  SUGGESTION_LIMIT_FOLLOW_UP,
} from "./pick-suggestions";
import { defaultRetrievalPlan } from "./retrieval-plan";

describe("pickSuggestions", () => {
  it("returns at most 3 cold-start items", () => {
    const items = pickSuggestions({
      mode: "cold_start",
      language: "en",
      userMessages: [],
    });
    assert.ok(items.length <= SUGGESTION_LIMIT_COLD_START);
    assert.ok(items.length > 0);
  });

  it("returns at most 2 follow-up items", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Tell me about FXTrade"],
    });
    assert.ok(items.length <= SUGGESTION_LIMIT_FOLLOW_UP);
    assert.ok(items.length > 0);
  });

  it("excludes already-asked question text", () => {
    const asked = "Where does FXTrade get currency data?";
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["data-sources"],
      }),
      userMessages: [asked],
    });
    assert.ok(!items.includes(asked));
  });

  it("FXTrade focus includes data-sources when not yet asked", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Tell me about FXTrade"],
    });
    assert.ok(items.some((s) => s.toLowerCase().includes("currency data")));
  });

  it("FXTrade focus excludes unrelated Konva/Memories chips", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Tell me about FXTrade"],
    });
    for (const item of items) {
      const lower = item.toLowerCase();
      assert.ok(
        !lower.includes("konva") && !lower.includes("memories"),
        `unexpected chip: ${item}`,
      );
    }
  });

  it("infers FXTrade focus from thread when plan focus is empty", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: [],
      }),
      userMessages: ["Tell me about FXTrade", "How do the charts work?"],
      assistantContext:
        "FXTrade uses lightweight-charts for candlesticks on the dashboard.",
    });
    for (const item of items) {
      const lower = item.toLowerCase();
      assert.ok(
        !lower.includes("konva") && !lower.includes("memories"),
        `unexpected chip: ${item}`,
      );
    }
  });

  it("off_topic only returns global redirects or empty", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({ intent: "off_topic" }),
      userMessages: ["what's the weather today"],
    });
    for (const item of items) {
      const isGlobal =
        item.includes("projects") ||
        item.includes("experience") ||
        item.includes("technologies") ||
        item.includes("university") ||
        item.includes("hire") ||
        item.includes("项目") ||
        item.includes("工作经历") ||
        item.includes("技术") ||
        item.includes("大学") ||
        item.includes("入职");
      assert.ok(isGlobal, `expected global redirect, got: ${item}`);
    }
  });

  it("cold start only returns cold_start kinds", () => {
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

  it("bank stays curated (not bloated)", async () => {
    const { SUGGESTION_BANK_SIZE } = await import("./suggestion-bank");
    assert.ok(SUGGESTION_BANK_SIZE >= 35 && SUGGESTION_BANK_SIZE <= 50);
  });
});
