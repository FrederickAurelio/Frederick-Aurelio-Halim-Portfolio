import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateSuggestions } from "./validate-suggestions";

describe("validateSuggestions", () => {
  it("caps count and trims duplicates", () => {
    const items = validateSuggestions({
      items: [" One ", "One", "Two", "Three"],
      userMessages: [],
      max: 2,
    });
    assert.deepEqual(items, ["One", "Two"]);
  });

  it("drops chips that match prior user messages", () => {
    const items = validateSuggestions({
      items: ["What stack is QuizConnect built with?", "How is it deployed?"],
      userMessages: ["What stack is QuizConnect built with?"],
    });
    assert.deepEqual(items, ["How is it deployed?"]);
  });

  it("drops chips shown on a previous turn", () => {
    const items = validateSuggestions({
      items: ["How is it deployed?", "What about charts?"],
      userMessages: [],
      previousSuggestions: ["How is it deployed?"],
    });
    assert.deepEqual(items, ["What about charts?"]);
  });

  it("drops chips already covered in the assistant answer", () => {
    const items = validateSuggestions({
      items: ["How are trades validated server-side?"],
      userMessages: [],
      assistantAnswer:
        "Trades are validated server-side before they hit the database using schema checks and balance guards.",
    });
    assert.deepEqual(items, []);
  });

  it("drops overlong chips", () => {
    const long = "a".repeat(120);
    const items = validateSuggestions({
      items: [long, "Short chip"],
      userMessages: [],
    });
    assert.deepEqual(items, ["Short chip"]);
  });
});
