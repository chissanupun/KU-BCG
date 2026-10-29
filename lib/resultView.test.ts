import test from "node:test";
import assert from "node:assert/strict";
import { parseTab, resultTags, safeHref } from "./resultView";
import type { GraphRagResult } from "./types";

const node = (label: string, type: "topic" | "faculty" | "course" | "bcg_pillar") => ({ label, color: "#000", type });

const base = (over: Partial<GraphRagResult> = {}): GraphRagResult => ({
  title: "t",
  overview: {},
  knowledge_graph: {
    center: node("Carbon Footprint", "topic"),
    nodes: [node("BCG_Green", "bcg_pillar"), node("วนศาสตร์", "faculty"), node("เกษตร", "faculty"), node("วนศาสตร์", "faculty")],
    edges: [],
  },
  learning_path: { estimated_hours: "", phases: [] },
  evidence: [],
  ...over,
});

test("parseTab falls back to overview", () => {
  assert.equal(parseTab("map"), "map");
  assert.equal(parseTab("path"), "path");
  assert.equal(parseTab("zzz"), "overview");
  assert.equal(parseTab(""), "overview");
  assert.equal(parseTab(null), "overview");
});

test("resultTags derives from graph nodes, deduped", () => {
  assert.deepEqual(resultTags(base()), { bcgPillars: ["BCG_Green"], faculties: ["วนศาสตร์", "เกษตร"] });
});

test("resultTags prefers API tags (C1) and tolerates old results", () => {
  const withTags = base({ tags: { bcg_pillars: ["BCG_Circular"], faculties: ["ประมง"] } });
  assert.deepEqual(resultTags(withTags), { bcgPillars: ["BCG_Circular"], faculties: ["ประมง"] });
  const old = base({ knowledge_graph: undefined as never });
  assert.deepEqual(resultTags(old), { bcgPillars: [], faculties: [] });
});

test("safeHref only passes http(s)", () => {
  assert.equal(safeHref("https://a.b/c"), "https://a.b/c");
  assert.equal(safeHref("HTTP://A.B"), "HTTP://A.B");
  assert.equal(safeHref("javascript:alert(1)"), undefined);
  assert.equal(safeHref(""), undefined);
  assert.equal(safeHref(undefined), undefined);
});
