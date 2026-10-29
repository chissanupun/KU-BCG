import assert from "node:assert/strict";
import test from "node:test";
import { idleStep } from "./idle";

test("idleStep: active until 25 min, warn until 30, then logout", () => {
  assert.equal(idleStep(0), "active");
  assert.equal(idleStep(25 * 60_000 - 1), "active");
  assert.equal(idleStep(25 * 60_000), "warn");
  assert.equal(idleStep(30 * 60_000 - 1), "warn");
  assert.equal(idleStep(30 * 60_000), "logout");
});
