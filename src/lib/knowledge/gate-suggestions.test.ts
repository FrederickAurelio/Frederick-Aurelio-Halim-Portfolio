import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  gateFollowUpSuggestions,
  isNarrowAnsweredTurn,
  pickScoredFallbackChips,
} from "./gate-suggestions";
import { defaultRetrievalPlan } from "./retrieval-plan";

describe("gateFollowUpSuggestions", () => {
  it("returns empty on narrow answered turns", () => {
    const asked = "How does real-time multiplayer work?";
    const input = {
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: ["quizconnect"],
        include_sections: ["5-architecture"],
      }),
      userMessages: ["Tell me about QuizConnect", asked],
      assistantAnswer:
        "Real-time multiplayer uses Socket.IO rooms and broadcasts quiz state over websockets.",
      retrievedChunkIds: ["quizconnect#5-architecture"],
      language: "en" as const,
    };
    assert.equal(isNarrowAnsweredTurn(input), true);
    const items = gateFollowUpSuggestions(
      ["What was the hardest part of QuizConnect?"],
      input,
    );
    assert.equal(items.length, 0);
  });

  it("returns empty after broad tech stack when chips score too low", () => {
    const items = gateFollowUpSuggestions(
      ["What should I look at first?", "Tell me about QuizConnect"],
      {
        plan: defaultRetrievalPlan({
          intent: "general",
          focus_doc_ids: ["about-me"],
          include_sections: ["at-a-glance", "tech-stack"],
        }),
        userMessages: ["What's your tech stack?"],
        assistantAnswer:
          "My primary stack is React, Next.js, TypeScript, and Express.",
        language: "en",
      },
    );
    assert.equal(items.length, 0);
  });

  it("allows strong trailer chips on focused project turns", () => {
    const items = gateFollowUpSuggestions(
      ["Where does FXTrade get currency data?"],
      {
        plan: defaultRetrievalPlan({
          intent: "project_detail",
          focus_doc_ids: ["nextjs-fxtrade"],
          include_sections: ["at-a-glance"],
        }),
        userMessages: ["Tell me about FXTrade"],
        assistantAnswer: "FXTrade is a forex dashboard built with Next.js.",
        language: "en",
      },
    );
    assert.ok(items.some((s) => s.toLowerCase().includes("currency data")));
  });

  it("suppresses bio trailer chips after who are you with substantive answer", () => {
    const items = gateFollowUpSuggestions(
      ["Tell me about your background", "Where did you study?"],
      {
        plan: defaultRetrievalPlan({
          intent: "bio",
          focus_doc_ids: ["about-me"],
          include_sections: ["at-a-glance"],
        }),
        userMessages: ["Who are you?"],
        assistantAnswer:
          "I'm Frederick, a frontend developer from Indonesia. I build web apps with React and Next.js.",
        language: "en",
      },
    );
    assert.equal(items.length, 0);
  });
});

describe("pickScoredFallbackChips", () => {
  it("returns empty when primary doc chips are exhausted", () => {
    const asked = "How does real-time multiplayer work?";
    const items = pickScoredFallbackChips({
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: ["quizconnect"],
        include_sections: ["5-architecture"],
      }),
      userMessages: [asked],
      previousSuggestions: ["What was the hardest part of QuizConnect?"],
      assistantAnswer:
        "Socket.IO rooms sync lobby state across players in real time.",
      retrievedChunkIds: ["quizconnect#5-architecture"],
      language: "en",
    });
    assert.equal(items.length, 0);
  });

  it("picks scored chips from primary focus doc only", () => {
    const items = pickScoredFallbackChips({
      plan: defaultRetrievalPlan({
        intent: "follow_up",
        focus_doc_ids: ["quizconnect", "about-me"],
      }),
      userMessages: [
        "What should I look at first?",
        "How did you set up the CI/CD pipeline?",
        "How does real-time multiplayer work?",
      ],
      language: "en",
    });
    assert.ok(!items.some((s) => s.toLowerCase().includes("background")));
    assert.ok(items.some((s) => s.toLowerCase().includes("hardest")));
  });
});
