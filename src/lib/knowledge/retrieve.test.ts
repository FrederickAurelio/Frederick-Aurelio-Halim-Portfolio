import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadKnowledgeIndex } from "./load-index";
import {
  applyEmptyTopicTopUp,
  mergeTopicResults,
  pickGlanceChunk,
} from "./retrieve";
import type { RetrievalTopic } from "./retrieval-plan";

describe("mergeTopicResults", () => {
  it("keeps per-topic hits and dedupes by best score", () => {
    const merged = mergeTopicResults(
      [
        [
          {
            id: "a",
            source: "docs/a.md",
            section: "A",
            text: "a",
            docId: "about-me",
            sectionId: "education",
            score: 0.9,
            topicLabel: "edu",
          },
          {
            id: "shared",
            source: "docs/a.md",
            section: "S",
            text: "s",
            docId: "about-me",
            sectionId: "at-a-glance",
            score: 0.5,
            topicLabel: "edu",
          },
        ],
        [
          {
            id: "shared",
            source: "docs/a.md",
            section: "S",
            text: "s",
            docId: "about-me",
            sectionId: "at-a-glance",
            score: 0.8,
            topicLabel: "work",
          },
          {
            id: "b",
            source: "docs/b.md",
            section: "B",
            text: "b",
            docId: "work-experience",
            sectionId: "mufy-at-a-glance",
            score: 0.7,
            topicLabel: "work",
          },
        ],
      ],
      10,
    );

    assert.equal(merged.length, 3);
    const shared = merged.find((chunk) => chunk.id === "shared");
    assert.equal(shared?.score, 0.8);
    assert.ok(merged.some((chunk) => chunk.id === "a"));
    assert.ok(merged.some((chunk) => chunk.id === "b"));
  });

  it("caps total chunks so one topic cannot dominate forever", () => {
    const topicA = Array.from({ length: 5 }, (_, i) => ({
      id: `a-${i}`,
      source: "docs/a.md",
      section: "A",
      text: "a",
      docId: "about-me",
      sectionId: "education",
      score: 1 - i * 0.01,
      topicLabel: "edu",
    }));
    const topicB = Array.from({ length: 5 }, (_, i) => ({
      id: `b-${i}`,
      source: "docs/b.md",
      section: "B",
      text: "b",
      docId: "work-experience",
      sectionId: "mufy-stack",
      score: 0.5 - i * 0.01,
      topicLabel: "work",
    }));

    const merged = mergeTopicResults([topicA, topicB], 4);
    assert.equal(merged.length, 4);
  });
});

describe("empty-topic top-up against index", () => {
  it("picks a glance chunk for a preferDocId", () => {
    const index = loadKnowledgeIndex();
    const glance = pickGlanceChunk(index.chunks, "quizconnect");
    assert.ok(glance);
    assert.equal(glance!.docId, "quizconnect");
    assert.match(glance!.sectionId, /at-a-glance|overview/i);
  });

  it("adds glance top-up when preferDoc has zero hits", () => {
    const index = loadKnowledgeIndex();
    const topics: RetrievalTopic[] = [
      {
        label: "quizconnect",
        query: "QuizConnect stack",
        preferDocId: "quizconnect",
      },
      {
        label: "memories",
        query: "Memories stack",
        preferDocId: "memories",
      },
    ];

    const onlyQuiz = [
      {
        id: "quizconnect#4-tech-stack",
        source: "docs/quizconnect.md",
        section: "Tech stack",
        text: "stack",
        docId: "quizconnect",
        sectionId: "4-tech-stack",
        score: 0.9,
        topicLabel: "quizconnect",
      },
    ];

    const topped = applyEmptyTopicTopUp(
      onlyQuiz,
      topics,
      index.chunks,
      12,
    );

    assert.ok(topped.some((chunk) => chunk.docId === "quizconnect"));
    assert.ok(topped.some((chunk) => chunk.docId === "memories"));
    const memories = topped.find((chunk) => chunk.docId === "memories");
    assert.equal(memories?.topicLabel, "memories");
  });
});
