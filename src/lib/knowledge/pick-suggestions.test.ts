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

  it("who are you follow-up stays empty when answer already covers at-a-glance", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "bio",
        focus_doc_ids: ["about-me"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Who are you?"],
      assistantAnswer:
        "I'm Frederick, a frontend developer from Indonesia. I build web apps with React and Next.js.",
    });
    assert.equal(items.length, 0);
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

  it("suppresses overview and chart chips when FXTrade answer already covers them", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["at-a-glance", "3-features"],
      }),
      userMessages: ["Tell me about FXTrade"],
      assistantAnswer:
        "FXTrade is a forex dashboard. It uses lightweight-charts for candlestick charts on the dashboard and pulls live currency data from external APIs.",
      retrievedChunkIds: [
        "nextjs-fxtrade#at-a-glance",
        "nextjs-fxtrade#3-features",
      ],
    });
    for (const item of items) {
      const lower = item.toLowerCase();
      assert.ok(
        !lower.includes("what does fxtrade do") && !lower.includes("charts"),
        `unexpected chip: ${item}`,
      );
    }
    assert.ok(items.length <= 1);
  });

  it("returns empty when user already asked a specific feature question", () => {
    const asked = "How does real-time multiplayer work?";
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: ["quizconnect"],
        include_sections: ["5-architecture"],
      }),
      userMessages: ["Tell me about QuizConnect", asked],
      assistantAnswer:
        "Real-time multiplayer uses Socket.IO rooms. Players join a lobby and the server broadcasts quiz state over websockets.",
      retrievedChunkIds: ["quizconnect#5-architecture"],
    });
    assert.ok(!items.includes(asked));
    assert.equal(items.length, 0);
  });

  it("suppresses chips for retrieved architecture sections", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["quizconnect"],
        include_sections: ["5-architecture"],
      }),
      userMessages: ["Tell me about QuizConnect"],
      assistantAnswer: "QuizConnect is a multiplayer quiz app with AI-generated questions.",
      retrievedChunkIds: ["quizconnect#5-architecture"],
    });
    for (const item of items) {
      const lower = item.toLowerCase();
      assert.ok(
        !lower.includes("deploy") &&
          !lower.includes("real-time") &&
          !lower.includes("multiplayer"),
        `unexpected chip: ${item}`,
      );
    }
  });

  it("only adds a second chip when it is strong and uncovered", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["nextjs-fxtrade"],
        include_sections: ["at-a-glance"],
      }),
      userMessages: ["Tell me about FXTrade"],
      assistantAnswer:
        "FXTrade is a forex trading dashboard built with Next.js and TypeScript. It shows live rates and charts for currency pairs on the main dashboard view.",
      retrievedChunkIds: ["nextjs-fxtrade#at-a-glance"],
    });
    assert.ok(items.length <= 1);
    if (items.length === 1) {
      assert.ok(items[0].toLowerCase().includes("currency data"));
    }
  });

  it("does not suggest FXTrade chips after country/work/study question even if prior turn was FXTrade", () => {
    const countryQuestion =
      "so you both work and study in china? is there any other country you work or study at?";
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({
        intent: "bio",
        focus_doc_ids: [],
        include_sections: ["education", "background"],
      }),
      userMessages: ["Tell me about FXTrade", countryQuestion],
      assistantContext:
        "FXTrade is a forex dashboard with live charts and currency data from Frankfurter API.",
      assistantAnswer:
        "Yes — both my study and work were in Hangzhou, China. I studied at Zhejiang University of Science and Technology and later worked on-site at Mufy AI, also in Hangzhou. No other country is documented for study or work.",
      retrievedChunkIds: ["about-me#education", "about-me#background"],
    });
    for (const item of items) {
      const lower = item.toLowerCase();
      assert.ok(
        !lower.includes("fxtrade") &&
          !lower.includes("currency data") &&
          !lower.includes("trades validated"),
        `unexpected project chip: ${item}`,
      );
    }
  });

  it("bio intent with empty focus never infers project from assistant context", () => {
    const items = pickSuggestions({
      mode: "follow_up",
      language: "en",
      plan: defaultRetrievalPlan({ intent: "bio", focus_doc_ids: [] }),
      userMessages: [
        "so you both work and study in china? is there any other country?",
      ],
      assistantContext:
        "FXTrade uses lightweight-charts and Frankfurter for currency data.",
      assistantAnswer:
        "Study and work were both in Hangzhou, China. No other country is documented.",
    });
    for (const item of items) {
      const lower = item.toLowerCase();
      assert.ok(!lower.includes("fxtrade"), `unexpected: ${item}`);
    }
  });
});
