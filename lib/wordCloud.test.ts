import test from "node:test";
import assert from "node:assert/strict";
import { cloudWords } from "./wordCloud";
import type { KnowledgeGraph } from "./types";

const n = (label: string) => ({ label, color: "#000", type: "topic" as const });
const graph: KnowledgeGraph = {
  center: n("hub"),
  nodes: [n("hub"), n("a"), n("b"), n("c")],
  edges: [
    { from: "hub", to: "a", type: "relatedTo" },
    { from: "hub", to: "b", type: "relatedTo" },
    { from: "a", to: "b", type: "relatedTo" },
  ],
};

test("weight is edge count, biggest first, centre left out", () => {
  const words = cloudWords(graph);
  assert.deepEqual(words.map((w) => [w.text, w.value]), [["a", 2], ["b", 2], ["c", 1]]);
});

test("max caps the list, and a missing graph is empty", () => {
  assert.equal(cloudWords(graph, 2).length, 2);
  assert.deepEqual(cloudWords(undefined), []);
});
