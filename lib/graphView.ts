import type { GraphEdge, KnowledgeGraph } from "./types";
import { humanLabel, isAiDraft } from "./kgText";

/** How many nodes the map draws before the reader asks for everything; more than this turns into a hairball. */
export const DEFAULT_MAX_NODES = 14;

const strength = (e: GraphEdge) => (isAiDraft(e) ? 1 : e.origin === "derived" ? 2 : 3);
const pairKey = (a: string, b: string) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);

/** Drops nodes of hidden types (never the center) and the edges that touch them. */
export function withoutTypes(graph: KnowledgeGraph, hiddenTypes: ReadonlySet<string>): KnowledgeGraph {
  if (hiddenTypes.size === 0) return graph;
  const center = graph.center.label;
  const hidden = new Set(graph.nodes.filter((n) => hiddenTypes.has(n.type) && n.label !== center).map((n) => n.label));
  return {
    ...graph,
    nodes: graph.nodes.filter((n) => !hidden.has(n.label)),
    edges: graph.edges.filter((e) => !hidden.has(e.from) && !hidden.has(e.to)),
  };
}

/**
 * Merges nodes the reader would see as the same thing ("Chitosan", "chitosan" and "ไคโตซาน" all read ไคโตซาน), keeping the
 * first label seen (the center's when it is one of them) and pointing every edge at it.
 */
export function mergeSameName(graph: KnowledgeGraph): KnowledgeGraph {
  const keep = new Map<string, string>();
  const canonical = (label: string) => {
    // The glossary is case-sensitive, so match on the raw label too.
    const keys = [humanLabel(label).trim().toLowerCase(), label.trim().toLowerCase()];
    const found = keys.map((k) => keep.get(k)).find(Boolean) ?? label;
    keys.forEach((k) => { if (!keep.has(k)) keep.set(k, found); });
    return found;
  };
  canonical(graph.center.label);
  const seen = new Set<string>();
  const nodes = graph.nodes.filter((n) => { const c = canonical(n.label); if (seen.has(c)) return false; seen.add(c); return c === n.label; });
  const edges = graph.edges.map((e) => ({ ...e, from: canonical(e.from), to: canonical(e.to) }));
  return { ...graph, nodes, edges };
}

/** One line per pair of nodes (the strongest: curated, then derived, then AI draft), no self-loops. */
export function oneEdgePerPair(edges: GraphEdge[]): GraphEdge[] {
  const best = new Map<string, GraphEdge>();
  for (const e of edges) {
    if (e.from === e.to) continue;
    const key = pairKey(e.from, e.to);
    const kept = best.get(key);
    if (!kept || strength(e) > strength(kept)) best.set(key, e);
  }
  return [...best.values()];
}

/**
 * The part of the graph worth drawing: grows outward from the center, always taking the best-connected neighbour next,
 * so the picture stays one connected cluster around the topic. Islands are added only while there is room, and nodes
 * with no edge at all are left out (the relation list still names everything).
 */
export function simplifyGraph(graph: KnowledgeGraph, maxNodes = DEFAULT_MAX_NODES): { graph: KnowledgeGraph; hiddenNodes: number } {
  const center = graph.center.label;
  const edges = oneEdgePerPair(graph.edges);
  const allLabels = new Set([center, ...graph.nodes.map((n) => n.label), ...edges.flatMap((e) => [e.from, e.to])]);

  const neighbours = new Map<string, Map<string, number>>();
  const link = (a: string, b: string, w: number) => {
    if (!neighbours.has(a)) neighbours.set(a, new Map());
    neighbours.get(a)!.set(b, w);
  };
  for (const e of edges) { link(e.from, e.to, strength(e)); link(e.to, e.from, strength(e)); }
  const score = (label: string) => [...(neighbours.get(label)?.values() ?? [])].reduce((s, w) => s + w, 0);

  const kept = new Set([center]);
  // A center with no edges (the backend named it after an entity no relation mentions) would leave the cluster
  // nowhere to grow from, so the best-connected node seeds it instead.
  if (!neighbours.has(center)) {
    const hub = [...neighbours.keys()].sort((a, b) => score(b) - score(a))[0];
    if (hub) kept.add(hub);
  }
  while (kept.size < maxNodes) {
    let next: string | undefined;
    let bestScore = -1;
    for (const label of kept) {
      for (const [other, w] of neighbours.get(label) ?? []) {
        if (kept.has(other)) continue;
        // A strong link into the drawn cluster counts most, then how connected the node is overall.
        const s = w * 100 + score(other);
        if (s > bestScore) { bestScore = s; next = other; }
      }
    }
    if (!next) {
      // Nothing touches the cluster any more: start the best-connected island, if any edge is left.
      for (const label of neighbours.keys()) {
        if (!kept.has(label) && score(label) > bestScore) { bestScore = score(label); next = label; }
      }
    }
    if (!next) break;
    kept.add(next);
  }

  // A graph with no edges at all still shows its nodes, up to the limit.
  if (edges.length === 0) graph.nodes.slice(0, maxNodes - 1).forEach((n) => kept.add(n.label));

  return {
    graph: {
      ...graph,
      nodes: graph.nodes.filter((n) => kept.has(n.label)),
      edges: edges.filter((e) => kept.has(e.from) && kept.has(e.to)),
    },
    hiddenNodes: allLabels.size - kept.size,
  };
}
