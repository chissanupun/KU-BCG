import { humanLabel } from "./kgText";
import type { KnowledgeGraph } from "./types";

export type CloudWord = { text: string; value: number };

/**
 * A node's weight is how many edges touch it, so the biggest words are the best-connected ideas.
 * The centre is left out: it is the search topic itself and would dwarf everything else.
 */
export function cloudWords(graph: KnowledgeGraph | undefined, max = 60): CloudWord[] {
  if (!graph) return [];
  const degree = new Map<string, number>();
  for (const e of graph.edges ?? []) {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  const seen = new Set<string>();
  const words: CloudWord[] = [];
  for (const n of graph.nodes ?? []) {
    const text = humanLabel(n.label);
    if (n.label === graph.center?.label || !text || seen.has(text)) continue;
    seen.add(text);
    words.push({ text, value: Math.max(1, degree.get(n.label) ?? 0) });
  }
  // Ties keep graph order (sort is stable), so the cloud does not reshuffle between renders.
  return words.sort((a, b) => b.value - a.value).slice(0, max);
}
