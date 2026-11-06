/** How connected a set of relations is: used to compare the graph before and after derived relations. */

export interface Metrics { nodes: number; edges: number; edgesPerNode: number; components: number; avgDegree: number }

export function graphMetrics(edges: { from: string; to: string }[]): Metrics {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    if (!parent.has(x)) parent.set(x, x);
    const p = parent.get(x)!;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  for (const e of edges) parent.set(find(e.from), find(e.to));
  const nodes = parent.size;
  const components = new Set([...parent.keys()].map(find)).size;
  const edgesPerNode = nodes ? edges.length / nodes : 0;
  return { nodes, edges: edges.length, edgesPerNode: +edgesPerNode.toFixed(2), components, avgDegree: +(edgesPerNode * 2).toFixed(2) };
}
