import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findTrailerMarkerIndex,
  isPartialMarkerPrefix,
  parseSuggestionTrailerPayload,
  SUGGESTION_TRAILER_MARKER,
  SuggestionTrailerFilter,
} from "./suggestion-trailer";

describe("findTrailerMarkerIndex", () => {
  it("returns -1 when marker is absent", () => {
    assert.equal(findTrailerMarkerIndex("Hello world"), -1);
  });

  it("ignores mid-line marker mentions", () => {
    const text = `The prompt says ${SUGGESTION_TRAILER_MARKER} at the end.\nAnswer here.\n${SUGGESTION_TRAILER_MARKER} ["Chip"]`;
    assert.equal(
      findTrailerMarkerIndex(text),
      text.lastIndexOf(SUGGESTION_TRAILER_MARKER),
    );
  });

  it("matches marker at start of stream", () => {
    assert.equal(findTrailerMarkerIndex(`${SUGGESTION_TRAILER_MARKER} []`), 0);
  });
});

describe("isPartialMarkerPrefix", () => {
  it("detects incomplete marker tails", () => {
    assert.equal(isPartialMarkerPrefix("@@SUGGE"), true);
    assert.equal(isPartialMarkerPrefix("@"), false);
    assert.equal(isPartialMarkerPrefix("hello"), false);
  });
});

describe("parseSuggestionTrailerPayload", () => {
  it("parses a JSON array of strings", () => {
    assert.deepEqual(
      parseSuggestionTrailerPayload(' ["How is it deployed?", "What stack?"] '),
      ["How is it deployed?", "What stack?"],
    );
  });

  it("parses fenced JSON", () => {
    assert.deepEqual(
      parseSuggestionTrailerPayload('```json\n["One", "Two"]\n```'),
      ["One", "Two"],
    );
  });

  it("returns empty array for empty trailer body", () => {
    assert.deepEqual(parseSuggestionTrailerPayload(""), []);
    assert.deepEqual(parseSuggestionTrailerPayload("[]"), []);
  });

  it("returns null for invalid JSON", () => {
    assert.equal(parseSuggestionTrailerPayload("not json"), null);
    assert.equal(parseSuggestionTrailerPayload('{"a":1}'), null);
  });
});

describe("SuggestionTrailerFilter", () => {
  it("passes through content when no marker is present", () => {
    const filter = new SuggestionTrailerFilter();
    assert.equal(filter.push("Hello "), "Hello ");
    assert.equal(filter.push("world."), "world.");

    const result = filter.finalize();
    assert.equal(result.markerFound, false);
    assert.equal(result.suggestions, null);
    assert.equal(result.flushedTail, "");
  });

  it("does not hold back a lone @ in an email address", () => {
    const filter = new SuggestionTrailerFilter();
    assert.equal(filter.push("email me at frederick.ah88@gmail.com"), "email me at frederick.ah88@gmail.com");

    const result = filter.finalize();
    assert.equal(result.flushedTail, "");
  });

  it("strips a trailer on one chunk", () => {
    const filter = new SuggestionTrailerFilter();
    const visible = filter.push(
      `FXTrade is a dashboard.\n${SUGGESTION_TRAILER_MARKER} ["Where does data come from?"]`,
    );
    assert.equal(visible, "FXTrade is a dashboard.\n");

    const result = filter.finalize();
    assert.equal(result.markerFound, true);
    assert.deepEqual(result.suggestions, ["Where does data come from?"]);
    assert.equal(result.flushedTail, "");
  });

  it("strips only the last line-anchored trailer", () => {
    const filter = new SuggestionTrailerFilter();
    const visible = filter.push(
      `Mention ${SUGGESTION_TRAILER_MARKER} in prose.\nReal answer.\n${SUGGESTION_TRAILER_MARKER} ["Next?"]`,
    );
    assert.ok(visible.includes("Mention"));
    assert.ok(visible.includes("Real answer."));
    assert.ok(!visible.includes('["Next?"]'));

    const result = filter.finalize();
    assert.deepEqual(result.suggestions, ["Next?"]);
  });

  it("handles marker split across chunks", () => {
    const filter = new SuggestionTrailerFilter();
    const marker = SUGGESTION_TRAILER_MARKER;
    const splitAt = 6;

    assert.equal(filter.push(`Answer text\n${marker.slice(0, splitAt)}`), `Answer text\n`);
    assert.equal(filter.push(`${marker.slice(splitAt)} ["Chip one"]`), "");

    const result = filter.finalize();
    assert.equal(result.markerFound, true);
    assert.deepEqual(result.suggestions, ["Chip one"]);
  });

  it("discards a partial marker prefix instead of flushing it as content", () => {
    const filter = new SuggestionTrailerFilter();
    assert.equal(filter.push("Done for now @@SUGGE"), "Done for now ");

    const result = filter.finalize();
    assert.equal(result.markerFound, false);
    assert.equal(result.suggestions, null);
    assert.equal(result.flushedTail, "");
  });

  it("treats an empty trailer array as an explicit no-chip choice", () => {
    const filter = new SuggestionTrailerFilter();
    filter.push(`${SUGGESTION_TRAILER_MARKER} []`);

    const result = filter.finalize();
    assert.equal(result.markerFound, true);
    assert.deepEqual(result.suggestions, []);
  });

  it("does not treat invalid trailer JSON as unparsed (empty chips, not fallback)", () => {
    const filter = new SuggestionTrailerFilter();
    filter.push(`${SUGGESTION_TRAILER_MARKER} not valid json`);

    const result = filter.finalize();
    assert.equal(result.markerFound, true);
    assert.deepEqual(result.suggestions, []);
  });
});
