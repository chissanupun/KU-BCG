import test from "node:test";
import assert from "node:assert/strict";
import { POLL_TIMEOUT_MS, pollStep } from "./searchPoll";

test("missing or ready status ends the poll (backend without C2)", () => {
  assert.equal(pollStep(undefined, 0), "done");
  assert.equal(pollStep("ready", 0), "done");
});

test("pending waits until the timeout, then gives up", () => {
  assert.equal(pollStep("pending", 0), "wait");
  assert.equal(pollStep("pending", POLL_TIMEOUT_MS - 1), "wait");
  assert.equal(pollStep("pending", POLL_TIMEOUT_MS), "timeout");
});

test("a result that turns ready on the last tick still wins over the timeout", () => {
  assert.equal(pollStep("ready", POLL_TIMEOUT_MS + 5000), "done");
});
