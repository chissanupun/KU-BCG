import assert from "node:assert/strict";
import { test } from "node:test";
import { checkUnits, orderUnits, type LearningUnit } from "./learningPath";
import concepts from "./learningConcepts.json";
import units from "../elastic-search/data/learning-units.json";

const u = (title: string, teaches: string[], needs: string[], difficulty: 1 | 2 | 3 = 1): LearningUnit => ({
  url: `https://x/${title}`, title, teaches, needs, difficulty, concept_source: "ai", difficulty_source: "ai",
});

test("a unit that needs what another teaches comes in a later phase", () => {
  const { ordered, phases } = orderUnits([u("C", ["c"], ["b"]), u("B", ["b"], ["a"]), u("A", ["a"], [])]);
  assert.equal(ordered, true);
  assert.deepEqual(phases.map((p) => p.map((x) => x.title)), [["A"], ["B"], ["C"]]);
});

test("the phase is the longest chain, so a shortcut does not pull a unit forward", () => {
  const { phases } = orderUnits([u("A", ["a"], []), u("B", ["b"], ["a"]), u("C", ["c"], ["a", "b"])]);
  assert.deepEqual(phases.map((p) => p.map((x) => x.title)), [["A"], ["B"], ["C"]]);
});

test("difficulty orders a phase but never moves a unit across phases", () => {
  const { phases } = orderUnits([u("hard", ["h"], [], 3), u("easy", ["e"], [], 1), u("late", ["l"], ["h"], 1)]);
  assert.deepEqual(phases.map((p) => p.map((x) => x.title)), [["easy", "hard"], ["late"]]);
});

test("units with no dependency between them are not reported as ordered", () => {
  assert.equal(orderUnits([u("A", ["a"], []), u("B", ["b"], [])]).ordered, false);
  assert.equal(orderUnits([]).ordered, false);
});

test("a cycle, an unknown concept and a self-dependency are rejected", () => {
  const ids = ["a", "b"];
  assert.match(checkUnits([u("A", ["a"], ["b"]), u("B", ["b"], ["a"])], ids)[0], /^cycle: A -> B -> A$/);
  assert.match(checkUnits([u("A", ["zzz"], [])], ids)[0], /unknown concept zzz/);
  assert.match(checkUnits([u("A", ["a"], ["a"])], ids)[0], /needs a, which it teaches/);
});

test("the drafted units are valid and give the expected chains", () => {
  const list = units as LearningUnit[];
  assert.deepEqual(checkUnits(list, concepts.map((c) => c.id)), []);
  const { ordered, phases } = orderUnits(list);
  assert.equal(ordered, true);
  assert.equal(phases.length, 2);
  const title = (url: string) => list.find((x) => x.url === url)!.title;
  assert.ok(phases[0].some((x) => x.title === title("https://kumooc.ku.th/courses/73/info")), "forest farm basics come first");
  assert.ok(phases[1].some((x) => x.title === title("https://sis.ku.ac.th/carbon-neutrality/")), "carbon neutrality follows the footprint course");
  assert.equal(new Set(list.map((x) => x.url)).size, list.length, "urls are unique");
});
