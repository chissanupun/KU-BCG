import type { TopicMapEdge, TopicMapNode } from "@/lib/topic";

export const CANVAS = { w: 606, h: 420 };

export type SimNode = {
  id: string;
  label: string;
  color: string;
  textColor?: string;
  type: string;
  degree: number;
  r: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Centre node, or a node the user dropped — excluded from force integration. */
  pinned: boolean;
  isCenter: boolean;
};

export type SimEdge = { from: SimNode; to: SimNode; type: string };

export const TYPE_LABELS: Record<string, string> = {
  topic: "หัวข้อ",
  faculty: "คณะ",
  course: "รายวิชา",
  bcg_pillar: "เสาหลัก BCG",
};

/** Degree drives radius so hubs read as hubs; orphans stay small and recede. */
function radiusFor(degree: number, isCenter: boolean): number {
  if (isCenter) return 40;
  if (degree === 0) return 12;
  return Math.min(30, 18 + degree * 4);
}

export function buildGraph(nodes: TopicMapNode[], edges: TopicMapEdge[]) {
  const degree = new Map<string, number>();
  edges.forEach((e) => {
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  });

  const byId = new Map<string, SimNode>();
  const connected: SimNode[] = [];
  const orphans: SimNode[] = [];

  nodes.forEach((node, i) => {
    if (byId.has(node.label)) return;
    const deg = degree.get(node.label) ?? 0;
    const isCenter = i === 0;
    const sim: SimNode = {
      id: node.label,
      label: node.label,
      color: node.color,
      textColor: node.textColor,
      type: node.type ?? "topic",
      degree: deg,
      r: radiusFor(deg, isCenter),
      x: node.cx ?? 0,
      y: node.cy ?? 0,
      vx: 0,
      vy: 0,
      pinned: isCenter,
      isCenter,
    };
    if (node.r !== undefined) sim.r = node.r;
    byId.set(node.label, sim);
    (deg > 0 || isCenter ? connected : orphans).push(sim);
  });

  const simEdges: SimEdge[] = edges
    .map((e) => ({ from: byId.get(e.from), to: byId.get(e.to), type: e.type }))
    .filter((e): e is SimEdge => Boolean(e.from && e.to));

  return { nodes: Array.from(byId.values()), edges: simEdges, connected, orphans };
}

/**
 * Seeds positions: centre in the middle, connected nodes on an inner ring, the
 * unconnected remainder on an outer band so they read as context rather than
 * competing with the network the user came to inspect.
 */
export function seedPositions(connected: SimNode[], orphans: SimNode[]) {
  const cx = CANVAS.w / 2;
  const cy = CANVAS.h / 2;

  connected.forEach((node, i) => {
    if (node.isCenter) {
      node.x = cx;
      node.y = cy;
      return;
    }
    const angle = (2 * Math.PI * i) / Math.max(connected.length - 1, 1);
    node.x = cx + Math.cos(angle) * 110;
    node.y = cy + Math.sin(angle) * 90;
  });

  orphans.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(orphans.length, 1);
    node.x = cx + Math.cos(angle) * 250;
    node.y = cy + Math.sin(angle) * 185;
  });
}

/**
 * One integration step. Ported from KnowledgeGraphView's simulation (itself a
 * port of ku-phumpanya's knowledge-graph.js) with collision separation added,
 * since node radii now vary with degree and hubs would otherwise swallow leaves.
 *
 * @returns kinetic energy, so the caller can stop the loop once it settles.
 */
export function tick(nodes: SimNode[], edges: SimEdge[]): number {
  const repulsion = 5200;
  const spring = 0.05;
  const idealLength = 105;
  const damping = 0.82;
  const centerPull = 0.015;
  const cx = CANVAS.w / 2;
  const cy = CANVAS.h / 2;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      const distSq = dx * dx + dy * dy + 0.01;
      const dist = Math.sqrt(distSq);

      let force = repulsion / distSq;
      // Hard separation when circles overlap — repulsion alone is too soft for it.
      const overlap = a.r + b.r + 6 - dist;
      if (overlap > 0) force += overlap * 0.6;

      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      if (!a.pinned) {
        a.vx += dx;
        a.vy += dy;
      }
      if (!b.pinned) {
        b.vx -= dx;
        b.vy -= dy;
      }
    }
  }

  edges.forEach((edge) => {
    const { from: a, to: b } = edge;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const force = spring * (dist - idealLength);
    dx = (dx / dist) * force;
    dy = (dy / dist) * force;
    if (!a.pinned) {
      a.vx += dx;
      a.vy += dy;
    }
    if (!b.pinned) {
      b.vx -= dx;
      b.vy -= dy;
    }
  });

  let energy = 0;
  nodes.forEach((node) => {
    if (node.pinned) {
      node.vx = 0;
      node.vy = 0;
      return;
    }
    node.vx += (cx - node.x) * centerPull;
    node.vy += (cy - node.y) * centerPull;
    node.vx *= damping;
    node.vy *= damping;
    node.x += node.vx;
    node.y += node.vy;
    energy += node.vx * node.vx + node.vy * node.vy;
  });

  return energy;
}
