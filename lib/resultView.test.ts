import test from "node:test";
import assert from "node:assert/strict";
import { parseTab, portalLinks, resultTags, safeHref } from "./resultView";
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

test("resultTags falls back per list when tags is partial", () => {
  const partial = base({ tags: { bcg_pillars: ["BCG_Circular"] } as never });
  assert.deepEqual(resultTags(partial), { bcgPillars: ["BCG_Circular"], faculties: ["วนศาสตร์", "เกษตร"] });
});

test("safeHref only passes http(s)", () => {
  assert.equal(safeHref("https://a.b/c"), "https://a.b/c");
  assert.equal(safeHref("HTTP://A.B"), "HTTP://A.B");
  assert.equal(safeHref("javascript:alert(1)"), undefined);
  assert.equal(safeHref("  https://a.b "), "https://a.b");
  assert.equal(safeHref(""), undefined);
  assert.equal(safeHref(undefined), undefined);
});

test("portalLinks gives one link per source site, from the evidence URLs only", () => {
  const ev = (source: "KUKR" | "KU_Forest" | "UNKNOWN", url: string) => ({ title: "t", source, url });
  assert.deepEqual(
    portalLinks([
      ev("KUKR", "https://kukr.lib.ku.ac.th/db/a"),
      ev("KUKR", "https://kukr.lib.ku.ac.th/db/b"), // same site again: no second link
      ev("KU_Forest", "https://forest.ku.ac.th/x?id=1"),
      ev("UNKNOWN", "https://other.example.org/p"),
      ev("KUKR", "javascript:alert(1)"), // not http(s): never a link
      ev("KUKR", "not a url"),
    ]),
    [
      { label: "KUKR", href: "https://kukr.lib.ku.ac.th" },
      { label: "KU Forest", href: "https://forest.ku.ac.th" },
      { label: "other.example.org", href: "https://other.example.org" },
    ],
  );
  assert.deepEqual(portalLinks(undefined), []);
});
