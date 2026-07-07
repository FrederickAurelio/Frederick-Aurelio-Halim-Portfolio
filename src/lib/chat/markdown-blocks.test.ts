import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  repairStreamingMarkdown,
  splitMarkdownBlocks,
} from "./markdown-blocks";

describe("splitMarkdownBlocks", () => {
  it("keeps fenced code blocks intact", () => {
    const input = "Intro\n\n```ts\nconst x = 1;\n```\n\nAfter";
    assert.deepEqual(splitMarkdownBlocks(input), [
      "Intro",
      "```ts\nconst x = 1;\n```",
      "After",
    ]);
  });

  it("groups consecutive list items", () => {
    const input = "- one\n- two\n\nParagraph";
    assert.deepEqual(splitMarkdownBlocks(input), ["- one\n- two", "Paragraph"]);
  });

  it("splits headings into their own blocks", () => {
    const input = "## Title\n\nBody";
    assert.deepEqual(splitMarkdownBlocks(input), ["## Title", "Body"]);
  });
});

describe("repairStreamingMarkdown", () => {
  it("closes an unclosed code fence", () => {
    assert.equal(repairStreamingMarkdown("```ts\nconst x = 1"), "```ts\nconst x = 1\n```");
  });

  it("closes an odd bold marker count", () => {
    assert.equal(repairStreamingMarkdown("This is **bold"), "This is **bold**");
  });
});
