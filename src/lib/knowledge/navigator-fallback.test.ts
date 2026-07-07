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
    assert.match(plan.answer_hint ?? "", /github\.com\/FrederickAurelio\/Bookling/);
  });

  it("not listed here question matches other projects and includes Bookling repo URL in hint", () => {
    const plan = fallbackRetrievalPlan(
      [],
      "do you have other projects that are not listed here?",
    );
    assert.equal(plan.intent, "general");
    assert.ok(plan.focus_doc_ids.includes("projects-overview"));
    assert.ok(plan.include_sections.includes("other-projects-github"));
    assert.match(plan.answer_hint ?? "", /github\.com\/FrederickAurelio\/Bookling/);
  });

  it("QuizConnect and Memories stack uses multi_project", () => {
    const plan = fallbackRetrievalPlan(
      [],
      "tech stack for QuizConnect and Memories",
    );
    assert.equal(plan.intent, "multi_project");
    assert.ok(plan.focus_doc_ids.includes("quizconnect"));
    assert.ok(plan.focus_doc_ids.includes("memories"));
    assert.ok(plan.include_sections.includes("tech-stack"));
  });

  it("timeline question uses multi_doc with about-me and work-experience", () => {
    const plan = fallbackRetrievalPlan(
      [],
      "give me your chronologically from when you start enter uni and list all your work time",
    );
    assert.equal(plan.intent, "multi_doc");
    assert.ok(plan.focus_doc_ids.includes("about-me"));
    assert.ok(plan.focus_doc_ids.includes("work-experience"));
  });

  it("timeline plus biggest project uses multi_doc not recommend_project", () => {
    const msg =
      "give me your chronologically from when you start enter uni and list all your work time. ofc with what you do on the work.. after that your biggest project";
    const plan = fallbackRetrievalPlan([], msg);
    assert.equal(plan.intent, "multi_doc");
    assert.ok(plan.focus_doc_ids.includes("about-me"));
    assert.ok(plan.focus_doc_ids.includes("work-experience"));
    assert.ok(plan.focus_doc_ids.includes("quizconnect"));
    assert.match(plan.answer_hint ?? "", /about-me/);
  });

  it("education plus recommend uses multi_doc in fallback", () => {
    const plan = fallbackRetrievalPlan([], "education history then recommend a project");
    assert.equal(plan.intent, "multi_doc");
    assert.ok(plan.focus_doc_ids.includes("about-me"));
    assert.ok(plan.focus_doc_ids.includes("quizconnect"));
  });

  it("work experience and two projects uses multi_doc in fallback", () => {
    const plan = fallbackRetrievalPlan(
      [],
      "work experience and QuizConnect and Memories",
    );
    assert.equal(plan.intent, "multi_doc");
    assert.ok(plan.focus_doc_ids.includes("work-experience"));
    assert.ok(plan.focus_doc_ids.includes("quizconnect"));
    assert.ok(plan.focus_doc_ids.includes("memories"));
  });
});
