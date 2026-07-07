import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { retrieveWithPlan } from "./retrieve";
import { defaultRetrievalPlan } from "./retrieval-plan";

describe("retrieveWithPlan multi_project", () => {
  it("fetches tech-stack chunk per focused project", async () => {
    const plan = defaultRetrievalPlan({
      intent: "multi_project",
      focus_doc_ids: ["quizconnect", "memories"],
      include_sections: ["tech-stack"],
      search_queries: [],
    });

    const result = await retrieveWithPlan(
      plan,
      "tech stack for QuizConnect and Memories",
    );

    assert.equal(result.plan.intent, "multi_project");
    assert.ok(result.chunks.length >= 2);

    const docIds = new Set(
      result.chunks.map((chunk) => {
        const match = chunk.id.match(/^([^#]+)#/);
        return match?.[1] ?? "";
      }),
    );

    assert.ok(docIds.has("quizconnect") || result.chunks.some((c) => c.source.includes("QuizConnect")));
    assert.ok(docIds.has("memories") || result.chunks.some((c) => c.source.includes("Memories")));

    const combined = result.chunks.map((c) => c.text).join("\n");
    assert.match(combined, /Socket\.IO|BullMQ|MongoDB/i);
    assert.match(combined, /Konva|Next\.js/i);
  });

  it("fetches four tech-stack chunks for all showcase projects", async () => {
    const plan = defaultRetrievalPlan({
      intent: "multi_project",
      focus_doc_ids: [
        "quizconnect",
        "memories",
        "nextjs-fxtrade",
        "promis-conveyor-chain",
      ],
      include_sections: ["tech-stack"],
      search_queries: [],
    });

    const result = await retrieveWithPlan(plan, "tech stack for all four projects");
    assert.ok(result.chunks.length >= 4);
  });
});

describe("retrieveWithPlan multi_doc", () => {
  it("fetches education and mufy-at-a-glance for timeline question", async () => {
    const plan = defaultRetrievalPlan({
      intent: "multi_doc",
      focus_doc_ids: ["about-me", "work-experience"],
      include_sections: ["education", "background", "mufy-at-a-glance"],
      search_queries: [],
    });

    const result = await retrieveWithPlan(
      plan,
      "chronologically from uni and list all work time",
    );

    assert.equal(result.plan.intent, "multi_doc");
    assert.ok(result.chunks.length >= 2);

    const combined = result.chunks.map((c) => c.text).join("\n");
    assert.match(combined, /Zhejiang|浙江科技|2026/i);
    assert.match(combined, /Mufy|May 2025|June 2026/i);
  });

  it("fetches chunks for work plus two projects", async () => {
    const plan = defaultRetrievalPlan({
      intent: "multi_doc",
      focus_doc_ids: ["work-experience", "quizconnect", "memories"],
      include_sections: ["mufy-at-a-glance", "at-a-glance"],
      search_queries: [],
    });

    const result = await retrieveWithPlan(
      plan,
      "work experience and QuizConnect and Memories",
    );

    assert.ok(result.chunks.length >= 3);
    const combined = result.chunks.map((c) => c.text).join("\n");
    assert.match(combined, /Mufy/i);
    assert.match(combined, /Socket\.IO|quiz/i);
    assert.match(combined, /Konva|scrapbook/i);
  });
});
