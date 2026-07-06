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

  it("returns 0 to 2 follow-up items based on score threshold", () => {
    const focused = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Tell me about FXTrade"],
    });
    assert.ok(focused.length <= SUGGESTION_LIMIT_FOLLOW_UP);
    assert.ok(focused.length > 0);

    const broad = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "general",
        focus_doc_ids: ["about-me"],
        include_sections: ["at-a-glance", "tech-stack"],
      }),
      userMessages: ["What's your tech stack?"],
      assistantContext:
        "My primary stack is React, Next.js, TypeScript, and Express.",
    });
    assert.ok(broad.length <= SUGGESTION_LIMIT_FOLLOW_UP);
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

  it("after general tech stack question, does not force flagship or FXTrade chips", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "general",
        focus_doc_ids: ["about-me"],
        include_sections: ["at-a-glance", "tech-stack"],
      }),
      userMessages: ["What's your tech stack?"],
      assistantContext:
        "My primary stack is React, Next.js, TypeScript, and Express. QuizConnect uses Socket.IO; Memories uses Konva on the canvas.",
    });
    assert.equal(items.length, 0);
  });

  it("who are you follow-up can show bio chips with broad threshold", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "bio",
        focus_doc_ids: ["about-me"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Who are you?"],
      assistantContext: "Frontend developer from Indonesia.",
    });
    assert.ok(items.length >= 1);
    assert.ok(items.length <= SUGGESTION_LIMIT_FOLLOW_UP);
  });

  it("shows flagship-style chip only when user asks for a recommendation", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "recommend_project",
        focus_doc_ids: ["projects-overview", "quizconnect"],
        include_sections: ["where-to-start", "why-flagship"],
      }),
      userMessages: ["What should I look at first?"],
      assistantContext: "QuizConnect is the largest project in the portfolio.",
    });
    assert.ok(items.length > 0);
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
    assert.ok(SUGGESTION_BANK_SIZE >= 38 && SUGGESTION_BANK_SIZE <= 52);
  });
});
