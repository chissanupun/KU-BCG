import test from "node:test";
import assert from "node:assert/strict";
import { mergeSameName, oneEdgePerPair, simplifyGraph, withoutTypes } from "./graphView";
import type { GraphEdge, KnowledgeGraph } from "./types";

const node = (label: string, type: KnowledgeGraph["center"]["type"] = "topic") => ({ label, type, color: "#000" });
const graphOf = (edges: GraphEdge[], extra: string[] = []): KnowledgeGraph => ({
  center: node("C"),
  nodes: [...new Set([...edges.flatMap((e) => [e.from, e.to]), ...extra])].filter((l) => l !== "C").map((l) => node(l)),
  edges,
});

test("oneEdgePerPair keeps the strongest line per pair and drops self-loops", () => {
  const edges = oneEdgePerPair([
    { from: "A", to: "B", type: "x", origin: "ai_suggested" },
    { from: "B", to: "A", type: "y" },
    { from: "A", to: "B", type: "z", origin: "derived" },
    { from: "A", to: "A", type: "self" },
  ]);
  assert.deepEqual(edges, [{ from: "B", to: "A", type: "y" }]);
});

test("simplifyGraph caps a hairball to one cluster around the center and says how much it hid", () => {
  const spokes = Array.from({ length: 30 }, (_, i) => ({ from: "C", to: `n${i}`, type: "relatedTo", origin: "derived" as const }));
  const { graph, hiddenNodes } = simplifyGraph(graphOf(spokes, ["lonely"]), 10);
  assert.equal(graph.nodes.length, 9);
  assert.equal(graph.edges.length, 9);
  assert.equal(hiddenNodes, 22);
  assert.ok(!graph.nodes.some((n) => n.label === "lonely"));
});

test("simplifyGraph prefers curated neighbours over derived and AI ones", () => {
  const { graph } = simplifyGraph(graphOf([
    { from: "C", to: "ai", type: "t", origin: "ai_suggested" },
    { from: "C", to: "derived", type: "t", origin: "derived" },
    { from: "C", to: "curated", type: "t" },
  ]), 3);
  assert.deepEqual(graph.nodes.map((n) => n.label).sort(), ["curated", "derived"]);
});

test("simplifyGraph keeps a small graph whole, islands included", () => {
  const input = graphOf([{ from: "C", to: "A", type: "t" }, { from: "X", to: "Y", type: "t", origin: "ai_suggested" }]);
  const { graph, hiddenNodes } = simplifyGraph(input);
  assert.equal(hiddenNodes, 0);
  assert.equal(graph.edges.length, 2);
});

test("simplifyGraph grows from the best-connected node when no edge touches the center", () => {
  const spokes = Array.from({ length: 5 }, (_, i) => ({ from: "hub", to: `n${i}`, type: "t", origin: "derived" as const }));
  const { graph } = simplifyGraph(graphOf([...spokes, { from: "x", to: "y", type: "t", origin: "ai_suggested" }]), 5);
  assert.deepEqual(graph.nodes.map((n) => n.label).sort(), ["hub", "n0", "n1", "n2"]);
});

test("mergeSameName folds labels that read the same into one node and re-points the edges", () => {
  const g = mergeSameName({
    center: node("rice"),
    nodes: [node("Chitosan"), node("chitosan"), node("Rice"), node("B")],
    edges: [{ from: "chitosan", to: "B", type: "t" }, { from: "Rice", to: "Chitosan", type: "t" }],
  });
  assert.deepEqual(g.nodes.map((n) => n.label), ["Chitosan", "B"]);
  assert.deepEqual(g.edges.map((e) => `${e.from}>${e.to}`), ["Chitosan>B", "rice>Chitosan"]);
});

test("withoutTypes hides a type and its edges but never the center", () => {
  const g: KnowledgeGraph = { center: node("C", "faculty"), nodes: [node("C", "faculty"), node("F", "faculty"), node("T")], edges: [{ from: "C", to: "F", type: "t" }, { from: "C", to: "T", type: "t" }] };
  const out = withoutTypes(g, new Set(["faculty"]));
  assert.deepEqual(out.nodes.map((n) => n.label), ["C", "T"]);
  assert.deepEqual(out.edges, [{ from: "C", to: "T", type: "t" }]);
});
