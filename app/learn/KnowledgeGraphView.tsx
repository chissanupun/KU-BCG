"use client";

import { useEffect, useRef } from "react";
import { AI_DRAFT_TEXT, edgeSentence, humanLabel, isAiDraft, TYPE_LABELS } from "@/lib/kgText";
import type { GraphEdge, KnowledgeGraph } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  topic: "#2D5A43",
  faculty: "#22C55E",
  course: "#3B82F6",
  bcg_pillar: "#EAB308",
};

type SimNode = {
  id: string;
  label: string;
  name: string;
  lines: string[];
  color: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
  /** The searched topic: drawn larger, even when another node holds the middle. */
  topic: boolean;
};

type SimEdge = { from: SimNode; to: SimNode; type: string; origin: GraphEdge["origin"] };

const FONT_SIZE = 13;
const LINE_HEIGHT = 15;
const NODE_R = 9;
const CENTER_R = 18;
/** Space a node and its name take up; layout keeps these boxes from overlapping. */
const BOX_W = 112;
const BOX_H = NODE_R * 2 + 6 + LINE_HEIGHT * 2;

const thaiWords = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("th", { granularity: "word" }) : null;

/** Two lines at most; Thai has no spaces, so break on word boundaries instead of mid-word. */
function wrapLabel(text: string, max = 13): string[] {
  if (text.length <= max) return [text];
  const words = thaiWords ? [...thaiWords.segment(text)].map((s) => s.segment) : text.split(/(?<= )/);
  let first = "";
  for (const w of words) {
    if (first && (first + w).length > max) break;
    first += w;
  }
  if (!first) first = text.slice(0, max);
  const rest = text.slice(first.length).trim();
  return [first.trim(), rest.length > max ? `${rest.slice(0, max - 1)}…` : rest].filter(Boolean);
}

function buildSimulation(graph: KnowledgeGraph) {
  const center = graph.center ?? { label: "Topic", color: TYPE_COLORS.topic, type: "topic" };
  const byLabel = new Map<string, SimNode>();

  const addNode = (label: string | undefined, meta: Partial<{ color: string; type: string }> = {}) => {
    if (!label) return;
    if (byLabel.has(label)) return;
    const name = humanLabel(label);
    byLabel.set(label, {
      id: label, label, name, lines: wrapLabel(name),
      color: meta.color ?? TYPE_COLORS.topic, type: meta.type ?? "topic",
      x: 0, y: 0, vx: 0, vy: 0, fixed: false, topic: false,
    });
  };

  addNode(center.label, center);
  (graph.nodes ?? []).forEach((node) => addNode(node.label, node));
  (graph.edges ?? []).forEach((edge) => { addNode(edge.from); addNode(edge.to); });

  const simNodes = [...byLabel.values()];
  const simEdges: SimEdge[] = (graph.edges ?? [])
    .map((edge) => ({ from: byLabel.get(edge.from), to: byLabel.get(edge.to), type: edge.type ?? "relatedTo", origin: edge.origin }))
    .filter((edge): edge is SimEdge => Boolean(edge.from && edge.to));

  // The topic sits in the middle, unless no line touches it; then the best-connected node does, so no line runs behind it.
  const degree = new Map<SimNode, number>();
  for (const { from, to } of simEdges) { degree.set(from, (degree.get(from) ?? 0) + 1); degree.set(to, (degree.get(to) ?? 0) + 1); }
  const topic = byLabel.get(center.label)!;
  const centerNode = degree.has(topic) || degree.size === 0 ? topic : [...degree].sort((a, b) => b[1] - a[1])[0][0];
  centerNode.fixed = true;
  topic.topic = true;

  // Direct neighbours of the center start on an inner ring, everything else further out, so the first frame is already readable.
  const nearCenter = new Set(simEdges.flatMap((e) => (e.from === centerNode ? [e.to] : e.to === centerNode ? [e.from] : [])));
  const rings = [simNodes.filter((n) => !n.fixed && nearCenter.has(n)), simNodes.filter((n) => !n.fixed && !nearCenter.has(n))];
  rings.forEach((ring, r) => ring.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(ring.length, 1) + r * 0.4;
    node.x = Math.cos(angle) * (150 + r * 130);
    node.y = Math.sin(angle) * (110 + r * 90);
  }));

  return { simNodes, simEdges };
}

/** Plain spring layout; nodes repel, edges pull, and the whole thing drifts toward the center node at (0, 0). */
function tick(simNodes: SimNode[], simEdges: SimEdge[], cooling: number) {
  const repulsion = 9000;
  const spring = 0.04;
  const idealLength = 150;
  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i], b = simNodes[j];
      // Names are wide, so horizontal distance counts for less: nodes spread sideways more than up and down.
      let dx = (a.x - b.x) * 0.6, dy = a.y - b.y;
      const distSq = dx * dx + dy * dy + 0.01;
      const dist = Math.sqrt(distSq);
      const force = repulsion / distSq;
      dx = (dx / dist) * force; dy = (dy / dist) * force;
      if (!a.fixed) { a.vx += dx; a.vy += dy; }
      if (!b.fixed) { b.vx -= dx; b.vy -= dy; }
    }
  }
  for (const { from: a, to: b } of simEdges) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const force = spring * (dist - idealLength);
    const fx = (dx / dist) * force, fy = (dy / dist) * force;
    if (!a.fixed) { a.vx += fx; a.vy += fy; }
    if (!b.fixed) { b.vx -= fx; b.vy -= fy; }
  }
  for (const node of simNodes) {
    if (node.fixed) { node.vx = node.vy = 0; continue; }
    node.vx += -node.x * 0.012;
    node.vy += -node.y * 0.018;
    node.vx *= 0.8; node.vy *= 0.8;
    node.x += node.vx * cooling;
    node.y += node.vy * cooling;
  }
}

/** Pushes apart any two nodes whose name boxes overlap, along the axis where they overlap least. */
function separateLabels(simNodes: SimNode[]) {
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < simNodes.length; i++) {
      for (let j = i + 1; j < simNodes.length; j++) {
        const a = simNodes[i], b = simNodes[j];
        const ox = BOX_W - Math.abs(a.x - b.x), oy = BOX_H - Math.abs(a.y - b.y);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        const share = a.fixed || b.fixed ? 1 : 0.5;
        if (ox < oy) {
          const push = (ox + 1) * share * Math.sign(a.x - b.x || 1);
          if (!a.fixed) a.x += push;
          if (!b.fixed) b.x -= push;
        } else {
          const push = (oy + 1) * share * Math.sign(a.y - b.y || 1);
          if (!a.fixed) a.y += push;
          if (!b.fixed) b.y -= push;
        }
      }
    }
    if (!moved) break;
  }
}

function layout(graph: KnowledgeGraph) {
  const sim = buildSimulation(graph);
  const steps = 300;
  for (let i = 0; i < steps; i++) tick(sim.simNodes, sim.simEdges, 1 - i / steps);
  separateLabels(sim.simNodes);
  return sim;
}

function renderGraph(svg: SVGSVGElement, simNodes: SimNode[], simEdges: SimEdge[]) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const ns = "http://www.w3.org/2000/svg";

  const edgeGroup = document.createElementNS(ns, "g");
  const nodeGroup = document.createElementNS(ns, "g");
  svg.append(edgeGroup, nodeGroup);

  const lines = simEdges.map((edge) => {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", String(edge.from.x));
    line.setAttribute("y1", String(edge.from.y));
    line.setAttribute("x2", String(edge.to.x));
    line.setAttribute("y2", String(edge.to.y));
    line.setAttribute("stroke", "#9ca3af");
    // Hand-curated lines are thick and solid, derived ones thin, AI drafts dashed.
    line.setAttribute("stroke-width", edge.origin === "derived" ? "1" : isAiDraft(edge) ? "1.5" : "2");
    if (isAiDraft(edge)) line.setAttribute("stroke-dasharray", "5 4");
    line.setAttribute("data-origin", edge.origin ?? "curated");
    line.setAttribute("opacity", "0.7");
    const title = document.createElementNS(ns, "title");
    title.textContent = edgeSentence(edge.from.label, edge.type, edge.to.label) + (isAiDraft(edge) ? ` (${AI_DRAFT_TEXT})` : "");
    line.appendChild(title);
    edgeGroup.appendChild(line);
    return { edge, line };
  });

  const groups = new Map<SimNode, SVGGElement>();
  for (const node of simNodes) {
    const radius = node.topic ? CENTER_R : NODE_R;
    const g = document.createElementNS(ns, "g");
    g.setAttribute("tabindex", "0");
    g.style.cursor = "default";
    g.style.transition = "opacity 120ms";

    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", String(node.x));
    circle.setAttribute("cy", String(node.y));
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", node.color);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");
    const title = document.createElementNS(ns, "title");
    title.textContent = `${node.name} (${TYPE_LABELS[node.type] ?? node.type})`;
    circle.appendChild(title);

    const text = document.createElementNS(ns, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", String(node.topic ? FONT_SIZE + 2 : FONT_SIZE));
    text.setAttribute("font-weight", node.topic ? "700" : "500");
    text.setAttribute("style", "fill:var(--ku-text);stroke:var(--ku-card-bg);stroke-width:3px;paint-order:stroke");
    node.lines.forEach((line, i) => {
      const span = document.createElementNS(ns, "tspan");
      span.setAttribute("x", String(node.x));
      span.setAttribute("y", String(node.y + radius + 14 + i * LINE_HEIGHT));
      span.textContent = line;
      text.appendChild(span);
    });

    g.append(circle, text);
    nodeGroup.appendChild(g);
    groups.set(node, g);
  }

  // Pointing at a node fades everything it is not linked to, so its relations can be read even in a busy map.
  const focus = (node: SimNode | null) => {
    const near = new Set<SimNode>(node ? [node] : []);
    if (node) for (const { from, to } of simEdges) { if (from === node) near.add(to); if (to === node) near.add(from); }
    for (const [n, g] of groups) g.style.opacity = !node || near.has(n) ? "1" : "0.15";
    for (const { edge, line } of lines) line.setAttribute("opacity", !node ? "0.7" : edge.from === node || edge.to === node ? "1" : "0.08");
  };
  for (const [node, g] of groups) {
    g.addEventListener("mouseenter", () => focus(node));
    g.addEventListener("focus", () => focus(node));
    g.addEventListener("mouseleave", () => focus(null));
    g.addEventListener("blur", () => focus(null));
  }

  // Fit the view to the drawn nodes plus room for their names.
  const xs = simNodes.map((n) => n.x), ys = simNodes.map((n) => n.y);
  const x0 = Math.min(...xs) - BOX_W / 2 - 8, x1 = Math.max(...xs) + BOX_W / 2 + 8;
  const y0 = Math.min(...ys) - CENTER_R - 8, y1 = Math.max(...ys) + BOX_H + 8;
  svg.setAttribute("viewBox", `${x0} ${y0} ${Math.max(x1 - x0, 240)} ${Math.max(y1 - y0, 160)}`);
}

export default function KnowledgeGraphView({
  graph,
  height = 360,
  ariaLabel,
}: {
  graph: KnowledgeGraph;
  height?: number | string;
  ariaLabel?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const { simNodes, simEdges } = layout(graph);
    if (simNodes.length > 0) renderGraph(svg, simNodes, simEdges);
  }, [graph]);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height, display: "block" }}
    />
  );
}
