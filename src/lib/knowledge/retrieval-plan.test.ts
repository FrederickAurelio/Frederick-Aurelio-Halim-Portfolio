import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadKnowledgeMap } from "./load-knowledge-map";
import {
  defaultRetrievalPlan,
  finalizePlan,
  parseRetrievalPlan,
  simpleFallbackPlan,
} from "./retrieval-plan";

const map = loadKnowledgeMap();

describe("parseRetrievalPlan", () => {
  it("parses topics and drops unknown preferDocId", () => {
    const plan = parseRetrievalPlan(
      {
        topics: [
          {
            label: "education",
            query: "Frederick university",
            preferDocId: "about-me",
          },
          {
            label: "bogus",
            query: "something",
            preferDocId: "not-a-real-doc",
          },
        ],
        answer_hint: "cover both",
        prefer_doc_ids: ["about-me", "ghost"],
        exclude_doc_ids: [],
        off_topic: false,
      },
      map,
    );

    assert.ok(plan);
    assert.equal(plan!.topics.length, 2);
    assert.equal(plan!.topics[0].preferDocId, "about-me");
    assert.equal(plan!.topics[1].preferDocId, undefined);
    assert.deepEqual(plan!.prefer_doc_ids, ["about-me"]);
    assert.equal(plan!.answer_hint, "cover both");
  });

  it("clamps to four topics and skips empty queries", () => {
    const plan = parseRetrievalPlan(
      {
        topics: [
          { label: "a", query: "one" },
          { label: "b", query: "" },
          { label: "c", query: "three" },
          { label: "d", query: "four" },
          { label: "e", query: "five" },
          { label: "f", query: "six" },
        ],
        off_topic: false,
      },
      map,
    );

    assert.ok(plan);
    assert.equal(plan!.topics.length, 4);
    assert.deepEqual(
      plan!.topics.map((topic) => topic.query),
      ["one", "three", "four", "five"],
    );
  });

  it("returns null for non-objects", () => {
    assert.equal(parseRetrievalPlan(null, map), null);
    assert.equal(parseRetrievalPlan("nope", map), null);
  });
});

describe("finalizePlan", () => {
  it("clears topics when off_topic", () => {
    const plan = finalizePlan(
      defaultRetrievalPlan({
        off_topic: true,
        topics: [{ label: "x", query: "weather" }],
      }),
      {
        message: "weather today?",
        primaryDocId: "quizconnect",
        map,
      },
    );

    assert.equal(plan.off_topic, true);
    assert.equal(plan.topics.length, 0);
  });

  it("fills general topic from message when empty", () => {
    const plan = finalizePlan(defaultRetrievalPlan({ topics: [] }), {
      message: "tell me about QuizConnect",
      primaryDocId: null,
      map,
    });

    assert.equal(plan.topics.length, 1);
    assert.equal(plan.topics[0].query, "tell me about QuizConnect");
  });

  it("applies sticky on vague follow-up", () => {
    const plan = finalizePlan(
      defaultRetrievalPlan({
        topics: [{ label: "general", query: "what stack?" }],
      }),
      {
        message: "what stack?",
        primaryDocId: "quizconnect",
        map,
        isVagueFollowUp: () => true,
        docTitle: () => "QuizConnect",
      },
    );

    assert.equal(plan.topics.length, 1);
    assert.equal(plan.topics[0].preferDocId, "quizconnect");
    assert.match(plan.topics[0].query, /QuizConnect/i);
    assert.deepEqual(plan.prefer_doc_ids, ["quizconnect"]);
  });

  it("does not sticky-override multi-topic plans", () => {
    const plan = finalizePlan(
      defaultRetrievalPlan({
        topics: [
          { label: "edu", query: "education", preferDocId: "about-me" },
          { label: "work", query: "mufy", preferDocId: "work-experience" },
        ],
      }),
      {
        message: "what stack?",
        primaryDocId: "quizconnect",
        map,
        isVagueFollowUp: () => true,
        docTitle: () => "QuizConnect",
      },
    );

    assert.equal(plan.topics.length, 2);
    assert.equal(plan.topics[0].preferDocId, "about-me");
  });
});

describe("simpleFallbackPlan", () => {
  it("uses user message and sticky preferDocId", () => {
    const plan = simpleFallbackPlan("what stack?", "quizconnect");
    assert.equal(plan.topics.length, 1);
    assert.equal(plan.topics[0].query, "what stack?");
    assert.equal(plan.topics[0].preferDocId, "quizconnect");
  });
});
