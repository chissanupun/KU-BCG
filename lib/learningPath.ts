/**
 * Orders learning units by what they teach and need (plan E). The live ordering runs in the
 * backend (Synthesizer::groupIntoPhases); this is the reference for it and what the data check uses.
 *
 * B comes after A when B needs a concept A teaches. A unit's phase is the length of the longest chain of
 * such units before it; units in one phase can be studied in parallel, listed easiest first.
 */
export type LearningUnit = {
  url: string;
  title: string;
  teaches: string[];
  needs: string[];
  /** 1 foundation, 2 intermediate, 3 advanced: the tie-break inside a phase, never the order itself. */
  difficulty: 1 | 2 | 3;
  concept_source: "curated" | "ai";
  difficulty_source: "curated" | "ai";
};

const dependencies = (units: LearningUnit[]) =>
  units.map((unit, i) =>
    units.flatMap((other, j) => (j !== i && other.teaches.some((c) => unit.needs.includes(c)) ? [j] : [])),
  );

/** Problems that must stop an import: unknown concepts, a unit needing what it teaches, a cycle. */
export function checkUnits(units: LearningUnit[], conceptIds: string[]): string[] {
  const known = new Set(conceptIds);
  const problems = units.flatMap((u) =>
    [...u.teaches, ...u.needs].filter((c) => !known.has(c)).map((c) => `${u.title}: unknown concept ${c}`),
  );
  units.forEach((u) => u.needs.filter((c) => u.teaches.includes(c)).forEach((c) => problems.push(`${u.title}: needs ${c}, which it teaches`)));
  if (problems.length) return problems;

  const deps = dependencies(units);
  const state = units.map(() => 0); // 0 new, 1 on the current path, 2 done
  const visit = (i: number, path: number[]): string | undefined => {
    if (state[i] === 1) return [...path.slice(path.indexOf(i)), i].map((k) => units[k].title).join(" -> ");
    if (state[i] === 2) return undefined;
    state[i] = 1;
    for (const j of deps[i]) { const cycle = visit(j, [...path, i]); if (cycle) return cycle; }
    state[i] = 2;
    return undefined;
  };
  for (let i = 0; i < units.length; i++) { const cycle = visit(i, []); if (cycle) return [`cycle: ${cycle}`]; }
  return [];
}

/** `ordered` is false when no unit depends on another: the caller then groups by topic and must not claim an order. */
export function orderUnits(units: LearningUnit[]): { ordered: boolean; phases: LearningUnit[][] } {
  const deps = dependencies(units);
  const depth: number[] = [];
  const depthOf = (i: number): number => (depth[i] ??= deps[i].length ? 1 + Math.max(...deps[i].map(depthOf)) : 0);
  units.forEach((_, i) => depthOf(i));

  const phases: LearningUnit[][] = [];
  units.forEach((u, i) => (phases[depth[i]] ??= []).push(u));
  phases.forEach((p) => p.sort((a, b) => a.difficulty - b.difficulty)); // stable: ties keep input order
  return { ordered: deps.some((d) => d.length > 0), phases };
}
