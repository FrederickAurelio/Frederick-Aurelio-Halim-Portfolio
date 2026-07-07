import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { fallbackRetrievalPlan } from "./navigator-fallback";

describe("fallbackRetrievalPlan", () => {
  it("does not pivot on other details about QuizConnect", () => {
    const plan = fallbackRetrievalPlan(
      [
        {
          role: "assistant",
          content: "QuizConnect is a real-time quiz app.",
        },
      ],
      "tell me other details about QuizConnect",
    );
    assert.notEqual(plan.intent, "pivot_other");
  });

  it("does not treat best feature question as recommend_project", () => {
    const plan = fallbackRetrievalPlan(
      [],
      "what's the best feature in QuizConnect?",
    );
    assert.notEqual(plan.intent, "recommend_project");
  });

  it("other projects question pulls other-projects-github section", () => {
    const plan = fallbackRetrievalPlan([], "any other projects besides these four?");
    assert.ok(plan.include_sections.includes("other-projects-github"));
    assert.match(plan.answer_hint ?? "", /Bookling/i);
  });
});
