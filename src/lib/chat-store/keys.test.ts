import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStoredMessage, serializeStoredMessage } from "./keys";

const sample = {
  id: "msg-1",
  role: "user" as const,
  content: "hello",
  createdAt: 1_700_000_000_000,
};

describe("parseStoredMessage", () => {
  it("parses JSON string from ioredis / Upstash without auto-deser", () => {
    const raw = serializeStoredMessage(sample);
    assert.deepEqual(parseStoredMessage(raw), sample);
  });

  it("parses pre-deserialized object from Upstash automaticDeserialization", () => {
    assert.deepEqual(parseStoredMessage({ ...sample }), sample);
  });

  it("returns null for invalid payloads", () => {
    assert.equal(parseStoredMessage(null), null);
    assert.equal(parseStoredMessage("[object Object]"), null);
    assert.equal(parseStoredMessage({ role: "system" }), null);
  });
});
