import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadKnowledgeMap } from "./load-knowledge-map";
import { finalizePlan, defaultRetrievalPlan } from "./retrieval-plan";
import {
  computeNextRoutingState,
  docTitleForId,
  isCasualNoise,
  isResumeTopicPhrase,
  isVagueFollowUp,
  parseSessionRoutingState,
} from "./session-routing-state";

const map = loadKnowledgeMap();

describe("session-routing-state helpers", () => {
  it("isCasualNoise matches hai/lol", () => {
    assert.equal(isCasualNoise("hai"), true);
    assert.equal(isCasualNoise("lol"), true);
    assert.equal(isCasualNoise("what stack?"), false);
  });

  it("isVagueFollowUp matches stack questions without project name", () => {
    assert.equal(isVagueFollowUp("what stack?"), true);
    assert.equal(isVagueFollowUp("how does auth work?"), true);
    assert.equal(isVagueFollowUp("QuizConnect stack"), false);
  });

  it("isResumeTopicPhrase matches back to main topic", () => {
    assert.equal(isResumeTopicPhrase("back to the main topic"), true);
    assert.equal(isResumeTopicPhrase("hello"), false);
  });
});

describe("sticky via finalizePlan", () => {
  it("fills preferDocId from sticky on vague follow-up", () => {
    const plan = finalizePlan(defaultRetrievalPlan({ topics: [] }), {
      message: "what stack?",
      primaryDocId: "quizconnect",
      map,
      isVagueFollowUp,
      docTitle: docTitleForId,
    });

    assert.equal(plan.topics[0]?.preferDocId, "quizconnect");
    assert.match(plan.topics[0]?.query ?? "", /QuizConnect|quizconnect/i);
  });

  it("does not sticky on casual noise path (finalize still needs a query)", () => {
    assert.equal(isVagueFollowUp("hai"), false);
    const plan = finalizePlan(defaultRetrievalPlan({ topics: [] }), {
      message: "hai",
      primaryDocId: "quizconnect",
      map,
      isVagueFollowUp,
      docTitle: docTitleForId,
    });
    assert.equal(plan.topics[0]?.query, "hai");
    assert.equal(plan.topics[0]?.preferDocId, undefined);
  });

  it("does not apply sticky when user names two projects", () => {
    assert.equal(
      isVagueFollowUp("QuizConnect and Memories stack"),
      false,
    );
  });
});

describe("computeNextRoutingState", () => {
  it("keeps sticky on off_topic", () => {
    const next = computeNextRoutingState(
      { primaryDocId: "quizconnect", updatedAt: 0 },
      defaultRetrievalPlan({ off_topic: true }),
      "what's the weather",
    );
    assert.equal(next.primaryDocId, "quizconnect");
  });

  it("updates from prefer_doc_ids", () => {
    const next = computeNextRoutingState(
      { primaryDocId: null, updatedAt: 0 },
      defaultRetrievalPlan({
        prefer_doc_ids: ["memories"],
        topics: [
          { label: "memories", query: "Memories app", preferDocId: "memories" },
        ],
      }),
      "tell me about Memories",
    );
    assert.equal(next.primaryDocId, "memories");
  });

  it("sets sticky from explicit project name", () => {
    const next = computeNextRoutingState(
      { primaryDocId: "memories", updatedAt: 0 },
      defaultRetrievalPlan({
        topics: [{ label: "general", query: "QuizConnect features" }],
      }),
      "tell me about QuizConnect",
    );
    assert.equal(next.primaryDocId, "quizconnect");
  });

  it("clears sticky when excluded primary and no new prefer", () => {
    const next = computeNextRoutingState(
      { primaryDocId: "quizconnect", updatedAt: 0 },
      defaultRetrievalPlan({
        exclude_doc_ids: ["quizconnect"],
        topics: [
          {
            label: "other",
            query: "other portfolio projects",
          },
        ],
      }),
      "another project",
    );
    assert.equal(next.primaryDocId, null);
  });

  it("personal country question sticks to about-me", () => {
    const next = computeNextRoutingState(
      { primaryDocId: "nextjs-fxtrade", updatedAt: 0 },
      defaultRetrievalPlan({
        topics: [
          {
            label: "bio",
            query: "countries lived",
            preferDocId: "about-me",
          },
        ],
        prefer_doc_ids: ["about-me"],
      }),
      "which countries have you lived in?",
    );
    assert.equal(next.primaryDocId, "about-me");
  });
});

describe("parseSessionRoutingState", () => {
  it("ignores legacy lastIntent field", () => {
    const state = parseSessionRoutingState({
      primaryDocId: "quizconnect",
      lastIntent: "project_detail",
      updatedAt: 123,
    });
    assert.equal(state.primaryDocId, "quizconnect");
    assert.equal(state.updatedAt, 123);
    assert.equal("lastIntent" in state, false);
  });
});
