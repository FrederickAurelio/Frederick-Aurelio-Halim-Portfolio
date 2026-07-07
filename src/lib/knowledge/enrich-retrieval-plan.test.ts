import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  enrichRetrievalPlanHeavy,
  enrichRetrievalPlanLight,
} from "./enrich-retrieval-plan";
import { defaultRetrievalPlan } from "./retrieval-plan";

describe("enrichRetrievalPlanLight", () => {
  it("does not change focus when message contains best", () => {
    const plan = defaultRetrievalPlan({
      intent: "project_detail",
      focus_doc_ids: ["quizconnect"],
      include_sections: ["at-a-glance"],
    });
    const result = enrichRetrievalPlanLight(
      plan,
      "what's the best feature in QuizConnect?",
    );
    assert.deepEqual(result.focus_doc_ids, ["quizconnect"]);
    assert.equal(result.intent, "project_detail");
  });

  it("adds tech-stack section when focus is set and message asks stack", () => {
    const plan = defaultRetrievalPlan({
      intent: "follow_up",
      focus_doc_ids: ["quizconnect"],
      include_sections: [],
    });
    const result = enrichRetrievalPlanLight(plan, "what stack?");
    assert.ok(result.include_sections.includes("tech-stack"));
  });
});

describe("enrichRetrievalPlanHeavy", () => {
  it("does not turn best feature question into recommend_project", () => {
    const plan = defaultRetrievalPlan({
      intent: "project_detail",
      focus_doc_ids: ["quizconnect"],
    });
    const result = enrichRetrievalPlanHeavy(
      plan,
      [],
      "what's the best feature in QuizConnect?",
    );
    assert.notEqual(result.intent, "recommend_project");
    assert.deepEqual(result.focus_doc_ids, ["quizconnect"]);
  });

  it("where should I start becomes recommend_project in heavy mode", () => {
    const plan = defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] });
    const result = enrichRetrievalPlanHeavy(plan, [], "where should I start?");
    assert.equal(result.intent, "recommend_project");
  });

  it("does not override non-empty focus from fallback", () => {
    const plan = defaultRetrievalPlan({
      intent: "project_detail",
      focus_doc_ids: ["quizconnect"],
    });
    const result = enrichRetrievalPlanHeavy(
      plan,
      [{ role: "assistant", content: "Memories is a scrapbook app." }],
      "what stack?",
    );
    assert.deepEqual(result.focus_doc_ids, ["quizconnect"]);
  });

  it("compare two named projects sets both in focus", () => {
    const plan = defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] });
    const result = enrichRetrievalPlanHeavy(
      plan,
      [],
      "compare QuizConnect vs Memories",
    );
    assert.ok(result.focus_doc_ids.includes("quizconnect"));
    assert.ok(result.focus_doc_ids.includes("memories"));
  });
});
