"use client";

import { useEffect, useRef } from "react";
import { edgeSentence, humanLabel, TYPE_LABELS } from "@/lib/kgText";
import type { KnowledgeGraph } from "@/lib/types";

/**
 * Force-directed layout, ported 1:1 from ku-phumpanya's resources/js/knowledge-graph.js
 * so both frontends render the graph the same way.
 */

const TYPE_COLORS: Record<string, string> = {
  topic: "#2D5A43",
  faculty: "#22C55E",
  course: "#3B82F6",
  bcg_pillar: "#EAB308",
};

type SimNode = {
  id: string;
  label: string;
  color: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed: boolean;
};

type SimEdge = { from: SimNode; to: SimNode; type: string };

/** Two lines of at most `max` characters; Thai has no spaces, so a long name is cut at the limit. */
const thaiWords = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter("th", { granularity: "word" }) : null;

/** Two lines at most; Thai has no spaces, so break on word boundaries instead of mid-word. */
function wrapLabel(text: string, max = 14): string[] {
  if (text.length <= max) return [text];
  const words = thaiWords ? [...thaiWords.segment(text)].map((s) => s.segment) : text.split(/(?<= )/);
  let first = "";
  for (const w of words) {
    if (first && (first + w).length > max) break;
    first += w;
  }
  const rest = text.slice(first.length).trim();
  return [first.trim(), rest.length > max ? `${rest.slice(0, max - 1)}…` : rest].filter(Boolean);
}

function buildSimulationNodes(graph: KnowledgeGraph, hiddenTypes: ReadonlySet<string>) {
  const center = graph.center ?? { label: "Topic", color: TYPE_COLORS.topic, type: "topic" };
  const nodes = graph.nodes ?? [];
  const edges = graph.edges ?? [];

  const byLabel = new Map<string, SimNode>();
  // Filtered-out nodes must stay out even when an edge names them; the center is never hidden.
  const hidden = new Set(nodes.filter((n) => hiddenTypes.has(n.type) && n.label !== center.label).map((n) => n.label));

  const addNode = (label: string | undefined, meta: Partial<{ color: string; type: string }> = {}) => {
    if (!label || hidden.has(label)) return undefined;
    if (byLabel.has(label)) return byLabel.get(label);
    const node: SimNode = {
      id: label,
      label,
      color: meta.color ?? TYPE_COLORS.topic,
      type: meta.type ?? "topic",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      fixed: false,
    };
    byLabel.set(label, node);
    return node;
  };

  const centerNode = addNode(center.label, center)!;
  centerNode.fixed = true;
  centerNode.color = center.color ?? TYPE_COLORS.topic;
  centerNode.type = center.type ?? "topic";

  nodes.forEach((node) => addNode(node.label, node));
  edges.forEach((edge) => {
    addNode(edge.from);
    addNode(edge.to);
  });

  const simNodes = Array.from(byLabel.values());
  const simEdges: SimEdge[] = edges
    .map((edge) => ({ from: byLabel.get(edge.from), to: byLabel.get(edge.to), type: edge.type ?? "relatedTo" }))
    .filter((edge): edge is SimEdge => Boolean(edge.from && edge.to));

  const width = 480;
  const height = 360;
  const cx = width / 2;
  const cy = height / 2;

  simNodes.forEach((node, index) => {
    if (node.fixed) {
      node.x = cx;
      node.y = cy;
      return;
    }
    const angle = (2 * Math.PI * index) / Math.max(simNodes.length, 1);
    node.x = cx + Math.cos(angle) * 90;
    node.y = cy + Math.sin(angle) * 90;
  });

  return { simNodes, simEdges, width, height, cx, cy };
}

function tickSimulation(simNodes: SimNode[], simEdges: SimEdge[], cx: number, cy: number) {
  const repulsion = 7000;
  const spring = 0.045;
  const idealLength = 115;
  const damping = 0.82;
  const centerPull = 0.02;

  for (let i = 0; i < simNodes.length; i++) {
    for (let j = i + 1; j < simNodes.length; j++) {
      const a = simNodes[i];
      const b = simNodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      const distSq = dx * dx + dy * dy + 0.01;
      const force = repulsion / distSq;
      const dist = Math.sqrt(distSq);
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      if (!a.fixed) {
        a.vx += dx;
        a.vy += dy;
      }
      if (!b.fixed) {
        b.vx -= dx;
        b.vy -= dy;
      }
    }
  }

  simEdges.forEach((edge) => {
    const a = edge.from;
    const b = edge.to;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
    const delta = dist - idealLength;
    const force = spring * delta;
    dx = (dx / dist) * force;
    dy = (dy / dist) * force;
    if (!a.fixed) {
      a.vx += dx;
      a.vy += dy;
    }
    if (!b.fixed) {
      b.vx -= dx;
      b.vy -= dy;
    }
  });

  simNodes.forEach((node) => {
    if (node.fixed) {
      node.vx = 0;
      node.vy = 0;
      return;
    }
    node.vx += (cx - node.x) * centerPull;
    node.vy += (cy - node.y) * centerPull;
    node.vx *= damping;
    node.vy *= damping;
    // Keep the circle and the two-line name under it inside the viewBox.
    node.x = Math.min(Math.max(node.x + node.vx, 50), 430);
    node.y = Math.min(Math.max(node.y + node.vy, 30), 310);
  });
}

function renderGraph(svg: SVGSVGElement, simNodes: SimNode[], simEdges: SimEdge[]) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const ns = "http://www.w3.org/2000/svg";

  simEdges.forEach((edge) => {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", String(edge.from.x));
    line.setAttribute("y1", String(edge.from.y));
    line.setAttribute("x2", String(edge.to.x));
    line.setAttribute("y2", String(edge.to.y));
    line.setAttribute("stroke", "#9ca3af");
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("opacity", "0.85");
    const title = document.createElementNS(ns, "title");
    title.textContent = edgeSentence(edge.from.label, edge.type, edge.to.label);
    line.appendChild(title);
    svg.appendChild(line);

  });

  simNodes.forEach((node) => {
    const radius = node.fixed ? 22 : 14;
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", String(node.x));
    circle.setAttribute("cy", String(node.y));
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", node.color);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");
    const name = humanLabel(node.label);
    const title = document.createElementNS(ns, "title");
    title.textContent = `${name} (${TYPE_LABELS[node.type] ?? node.type})`;
    circle.appendChild(title);

    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", String(node.x));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-weight", node.fixed ? "700" : "500");
    text.setAttribute("style", "fill:var(--ku-text);stroke:var(--ku-card-bg);stroke-width:3px;paint-order:stroke");
    wrapLabel(name).forEach((line, i) => {
      const span = document.createElementNS(ns, "tspan");
      span.setAttribute("x", String(node.x));
      span.setAttribute("y", String(node.y + radius + 17 + i * 18));
      span.textContent = line;
      text.appendChild(span);
    });

    svg.appendChild(circle);
    svg.appendChild(text);
  });

  // Fit the view to the drawn nodes (plus room for the names under them) so a small graph is not left tiny in empty space.
  const xs = simNodes.map((n) => n.x), ys = simNodes.map((n) => n.y);
  const x0 = Math.min(...xs) - 70, x1 = Math.max(...xs) + 70;
  const y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 65;
  svg.setAttribute("viewBox", `${x0} ${y0} ${Math.max(x1 - x0, 200)} ${Math.max(y1 - y0, 150)}`);
}

const NO_HIDDEN: ReadonlySet<string> = new Set();

export default function KnowledgeGraphView({
  graph,
  hiddenTypes = NO_HIDDEN,
  height = 360,
  ariaLabel,
}: {
  graph: KnowledgeGraph;
  hiddenTypes?: ReadonlySet<string>;
  height?: number | string;
  ariaLabel?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const { simNodes, simEdges, width, height, cx, cy } = buildSimulationNodes(graph, hiddenTypes);
    if (simNodes.length === 0) return;

    let frame = 0;
    const maxFrames = 90;
    let raf = 0;

    const animate = () => {
      tickSimulation(simNodes, simEdges, cx, cy);
      renderGraph(svg, simNodes, simEdges);
      frame += 1;
      if (frame < maxFrames) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [graph, hiddenTypes]);

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", height, display: "block" }}
    />
  );
}
