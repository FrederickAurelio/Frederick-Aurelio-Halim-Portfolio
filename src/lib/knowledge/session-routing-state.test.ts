import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applySessionRoutingToPlan,
  computeNextRoutingState,
  EMPTY_SESSION_ROUTING_STATE,
  isCasualNoise,
  isResumeTopicPhrase,
  isVagueFollowUp,
} from "./session-routing-state";
import { defaultRetrievalPlan } from "./retrieval-plan";

describe("session-routing-state", () => {
  it("isCasualNoise matches hai/lol", () => {
    assert.equal(isCasualNoise("hai"), true);
    assert.equal(isCasualNoise("lol"), true);
    assert.equal(isCasualNoise("what stack?"), false);
  });

  it("isVagueFollowUp matches stack questions without project name", () => {
    assert.equal(isVagueFollowUp("what stack?"), true);
    assert.equal(isVagueFollowUp("tell me about QuizConnect"), false);
  });

  it("applySessionRouting fills focus from sticky on vague follow-up", () => {
    const plan = defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] });
    const session = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const result = applySessionRoutingToPlan(plan, "what stack?", session);
    assert.deepEqual(result.focus_doc_ids, ["quizconnect"]);
    assert.equal(result.intent, "follow_up");
  });

  it("applySessionRouting does not fire on casual noise", () => {
    const plan = defaultRetrievalPlan({ intent: "off_topic" });
    const session = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const result = applySessionRoutingToPlan(plan, "hai", session);
    assert.deepEqual(result.focus_doc_ids, []);
    assert.equal(result.intent, "off_topic");
  });

  it("applySessionRouting does not override existing focus", () => {
    const plan = defaultRetrievalPlan({
      intent: "project_detail",
      focus_doc_ids: ["memories"],
    });
    const session = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const result = applySessionRoutingToPlan(plan, "what stack?", session);
    assert.deepEqual(result.focus_doc_ids, ["memories"]);
  });

  it("applySessionRouting respects explicit project in message", () => {
    const plan = defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] });
    const session = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const result = applySessionRoutingToPlan(
      plan,
      "tell me about Memories",
      session,
    );
    assert.deepEqual(result.focus_doc_ids, []);
  });

  it("computeNextRoutingState keeps sticky on off_topic", () => {
    const prev = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const next = computeNextRoutingState(
      prev,
      defaultRetrievalPlan({ intent: "off_topic" }),
      "hai",
    );
    assert.equal(next.primaryDocId, "quizconnect");
  });

  it("computeNextRoutingState updates from plan focus", () => {
    const next = computeNextRoutingState(
      EMPTY_SESSION_ROUTING_STATE,
      defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["quizconnect"],
      }),
      "tell me about QuizConnect",
    );
    assert.equal(next.primaryDocId, "quizconnect");
  });

  it("isResumeTopicPhrase matches back to main topic", () => {
    assert.equal(
      isResumeTopicPhrase("back to main topic what's stack?"),
      true,
    );
  });

  it("simulates QuizConnect then noise then what stack via sticky", () => {
    let session = computeNextRoutingState(
      EMPTY_SESSION_ROUTING_STATE,
      defaultRetrievalPlan({
        intent: "project_detail",
        focus_doc_ids: ["quizconnect"],
      }),
      "tell me about QuizConnect",
    );
    assert.equal(session.primaryDocId, "quizconnect");

    session = computeNextRoutingState(
      session,
      defaultRetrievalPlan({ intent: "off_topic" }),
      "hai",
    );
    assert.equal(session.primaryDocId, "quizconnect");

    session = computeNextRoutingState(
      session,
      defaultRetrievalPlan({ intent: "off_topic" }),
      "lol",
    );
    assert.equal(session.primaryDocId, "quizconnect");

    const plan = applySessionRoutingToPlan(
      defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] }),
      "what stack?",
      session,
    );
    assert.deepEqual(plan.focus_doc_ids, ["quizconnect"]);
  });

  it("simulates resume phrase after noise", () => {
    const session = {
      primaryDocId: "quizconnect",
      lastIntent: "off_topic" as const,
      updatedAt: 1,
    };
    const plan = applySessionRoutingToPlan(
      defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] }),
      "back to main topic what's stack?",
      session,
    );
    assert.deepEqual(plan.focus_doc_ids, ["quizconnect"]);
  });

  it("computeNextRoutingState clears on pivot_other", () => {
    const prev = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const next = computeNextRoutingState(
      prev,
      defaultRetrievalPlan({ intent: "pivot_other", exclude_doc_ids: ["quizconnect"] }),
      "another project",
    );
    assert.equal(next.primaryDocId, null);
  });

  it("does not apply sticky when user names two projects", () => {
    const plan = defaultRetrievalPlan({ intent: "general", focus_doc_ids: [] });
    const session = { primaryDocId: "quizconnect", lastIntent: null, updatedAt: 0 };
    const result = applySessionRoutingToPlan(
      plan,
      "tech stack for QuizConnect and Memories",
      session,
    );
    assert.deepEqual(result.focus_doc_ids, []);
  });

  it("multi_doc sets sticky to first focus doc", () => {
    const prev = { primaryDocId: null, lastIntent: null, updatedAt: 0 };
    const plan = defaultRetrievalPlan({
      intent: "multi_doc",
      focus_doc_ids: ["about-me", "work-experience"],
    });
    const next = computeNextRoutingState(
      prev,
      plan,
      "chronologically from uni and work",
    );
    assert.equal(next.primaryDocId, "about-me");
    assert.equal(next.lastIntent, "multi_doc");
  });
});
