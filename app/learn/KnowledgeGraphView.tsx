"use client";

import { useEffect, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior } from "d3-zoom";
import { AI_DRAFT_TEXT, edgeSentence, humanLabel, isAiDraft, isGenericPredicate, originText, TYPE_LABELS } from "@/lib/kgText";
import { FONT } from "../components/roadmap/tokens";
import { fitView } from "@/lib/graphView";
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
function separateLabels(simNodes: SimNode[], passes = 60) {
  for (let pass = 0; pass < passes; pass++) {
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

/** Below this zoom the names of minor nodes are hidden, so a zoomed-out busy map reads as dots and hubs. */
const LABEL_MIN_ZOOM = 0.6;
const HUB_DEGREE = 3;
const ZOOM_RANGE: [number, number] = [0.2, 6];

/** What the reader clicked: a dot, or a line between two dots. */
type Picked = { kind: "node"; label: string } | { kind: "edge"; from: string; to: string; type: string; origin?: GraphEdge["origin"] };

type Scene = {
  viewport: SVGGElement;
  /** Keeps a node or line lit (its neighbours stay clear, the rest fade) until it is cleared with null. */
  pin: (target: SimNode | SimEdge | null) => void;
  /** Pin it and tell the page what was picked. */
  pick: (target: SimNode | SimEdge | null) => void;
  /** Moves every line, dot and name to the nodes' current positions. */
  update: () => void;
  /** Hides or shows the names that are too small to read at this zoom. */
  setZoom: (k: number) => void;
  groups: Map<SimNode, SVGGElement>;
};

function renderGraph(svg: SVGSVGElement, simNodes: SimNode[], simEdges: SimEdge[], onPick: (picked: Picked | null) => void): Scene {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const ns = "http://www.w3.org/2000/svg";

  const viewport = document.createElementNS(ns, "g");
  const edgeGroup = document.createElementNS(ns, "g");
  const hitGroup = document.createElementNS(ns, "g"); // wide invisible copies of the lines: a 1px line is too thin to click
  const nodeGroup = document.createElementNS(ns, "g");
  viewport.append(edgeGroup, hitGroup, nodeGroup);
  svg.append(viewport);

  const degree = new Map<SimNode, number>();
  for (const { from, to } of simEdges) { degree.set(from, (degree.get(from) ?? 0) + 1); degree.set(to, (degree.get(to) ?? 0) + 1); }
  // The more lines touch a node, the bigger its dot: the best-connected ideas stand out without reading a name.
  const radiusOf = (node: SimNode) => (node.topic ? CENTER_R : NODE_R - 3 + Math.min(degree.get(node) ?? 0, 6) * 0.8);

  const baseOpacity = (edge: SimEdge) => (isAiDraft(edge) ? "0.5" : "0.45");
  const lines = simEdges.map((edge) => {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("stroke", "#9ca3af");
    // Hand-curated lines are the firmest, derived ones the finest, AI drafts dashed.
    line.setAttribute("stroke-width", edge.origin === "derived" ? "0.8" : "1.3");
    if (isAiDraft(edge)) line.setAttribute("stroke-dasharray", "5 4");
    line.setAttribute("data-origin", edge.origin ?? "curated");
    line.setAttribute("opacity", baseOpacity(edge));
    line.style.pointerEvents = "none";
    edgeGroup.appendChild(line);

    const hit = document.createElementNS(ns, "line");
    hit.setAttribute("data-hit", "");
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("stroke-width", "14");
    hit.style.cursor = "pointer";
    const title = document.createElementNS(ns, "title");
    title.textContent = edgeSentence(edge.from.label, edge.type, edge.to.label) + (isAiDraft(edge) ? ` (${AI_DRAFT_TEXT})` : "");
    hit.appendChild(title);
    hit.addEventListener("click", () => pick(edge));
    hitGroup.appendChild(hit);
    return { edge, line, hit };
  });

  const groups = new Map<SimNode, SVGGElement>();
  const circles = new Map<SimNode, SVGCircleElement>();
  const texts = new Map<SimNode, SVGTextElement>();
  for (const node of simNodes) {
    const radius = radiusOf(node);
    const g = document.createElementNS(ns, "g");
    g.setAttribute("tabindex", "0");
    g.setAttribute("data-node", "");
    g.style.cursor = "grab";
    g.style.transition = "opacity 120ms";

    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", node.color);
    circle.style.stroke = "var(--ku-card-bg)";
    circle.setAttribute("stroke-width", "1.5");
    const title = document.createElementNS(ns, "title");
    title.textContent = `${node.name} (${TYPE_LABELS[node.type] ?? node.type})`;
    circle.appendChild(title);

    const text = document.createElementNS(ns, "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", String(node.topic ? FONT_SIZE + 2 : FONT_SIZE));
    text.setAttribute("font-weight", node.topic ? "700" : "500");
    text.setAttribute("style", "fill:var(--ku-text);stroke:var(--ku-card-bg);stroke-width:3px;paint-order:stroke;pointer-events:none;transition:opacity 120ms");
    node.lines.forEach((line) => {
      const span = document.createElementNS(ns, "tspan");
      span.textContent = line;
      text.appendChild(span);
    });

    g.append(circle, text);
    nodeGroup.appendChild(g);
    groups.set(node, g);
    circles.set(node, circle);
    texts.set(node, text);
  }

  const update = () => {
    for (const { edge, line, hit } of lines) {
      for (const el of [line, hit]) {
        el.setAttribute("x1", String(edge.from.x));
        el.setAttribute("y1", String(edge.from.y));
        el.setAttribute("x2", String(edge.to.x));
        el.setAttribute("y2", String(edge.to.y));
      }
    }
    for (const node of simNodes) {
      const circle = circles.get(node)!;
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      const radius = Number(circle.getAttribute("r"));
      texts.get(node)!.querySelectorAll("tspan").forEach((span, i) => {
        span.setAttribute("x", String(node.x));
        span.setAttribute("y", String(node.y + radius + 14 + i * LINE_HEIGHT));
      });
    }
  };

  let zoomK = 1;
  let near = new Set<SimNode>();
  const paintNames = () => {
    for (const node of simNodes) {
      const shown = node.topic || (degree.get(node) ?? 0) >= HUB_DEGREE || zoomK >= LABEL_MIN_ZOOM || near.has(node);
      texts.get(node)!.style.opacity = shown ? "1" : "0";
    }
  };

  // Lighting a node (or a line) fades everything it is not linked to, so its relations can be read even in a busy map.
  let pinned: SimNode | SimEdge | null = null;
  const light = (target: SimNode | SimEdge | null) => {
    near = new Set<SimNode>();
    let touches = (_: SimEdge) => false;
    if (target && "from" in target) {
      near = new Set([target.from, target.to]);
      touches = (e) => e === target;
    } else if (target) {
      near = new Set([target]);
      for (const { from, to } of simEdges) { if (from === target) near.add(to); if (to === target) near.add(from); }
      touches = (e) => e.from === target || e.to === target;
    }
    for (const [n, g] of groups) g.style.opacity = !target || near.has(n) ? "1" : "0.15";
    for (const { edge, line } of lines) line.setAttribute("opacity", !target ? baseOpacity(edge) : touches(edge) ? "1" : "0.08");
    paintNames();
  };
  const pin = (target: SimNode | SimEdge | null) => { pinned = target; light(target); };
  const pick = (target: SimNode | SimEdge | null) => {
    pin(target);
    onPick(!target ? null : "from" in target
      ? { kind: "edge", from: target.from.label, to: target.to.label, type: target.type, origin: target.origin }
      : { kind: "node", label: target.label });
  };
  for (const [node, g] of groups) {
    g.addEventListener("mouseenter", () => light(node));
    g.addEventListener("focus", () => light(node));
    g.addEventListener("mouseleave", () => light(pinned));
    g.addEventListener("blur", () => light(pinned));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(node); } });
  }

  update();
  paintNames();
  return { viewport, pin, pick, update, setZoom: (k) => { zoomK = k; paintNames(); }, groups };
}

/**
 * Dragging a node pulls its neighbours along on the same springs the layout used, then lets them settle.
 * Nothing moves until the reader grabs something. Returns a cleanup that stops the animation.
 */
function enableDrag(scene: Scene, simNodes: SimNode[], simEdges: SimEdge[], toGraph: (clientX: number, clientY: number) => [number, number]) {
  const SETTLE_FRAMES = 90;
  let held: SimNode | null = null;
  let settle = 0;
  let raf = 0;

  const step = () => {
    tick(simNodes, simEdges, 0.5);
    separateLabels(simNodes, 3);
    scene.update();
    settle -= 1;
    raf = held || settle > 0 ? requestAnimationFrame(step) : 0;
  };
  const run = () => { if (!raf) raf = requestAnimationFrame(step); };

  for (const [node, g] of scene.groups) {
    let wasFixed = false;
    let grabX = 0, grabY = 0; // where inside the dot it was grabbed, so it does not jump to the pointer
    let downX = 0, downY = 0;
    g.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || held) return;
      e.stopPropagation(); // keep the pan gesture off the node
      g.setPointerCapture(e.pointerId);
      downX = e.clientX;
      downY = e.clientY;
      const [x, y] = toGraph(e.clientX, e.clientY);
      grabX = node.x - x;
      grabY = node.y - y;
      held = node;
      wasFixed = node.fixed;
      node.fixed = true;
      g.style.cursor = "grabbing";
      run();
    });
    g.addEventListener("pointermove", (e) => {
      if (held !== node) return;
      const [x, y] = toGraph(e.clientX, e.clientY);
      node.x = x + grabX;
      node.y = y + grabY;
    });
    const release = () => {
      if (held !== node) return;
      node.fixed = wasFixed;
      held = null;
      g.style.cursor = "grab";
      settle = SETTLE_FRAMES;
      run();
    };
    g.addEventListener("pointerup", (e) => {
      // A press that barely moved is a click, not a drag: explain the node.
      const click = held === node && Math.hypot(e.clientX - downX, e.clientY - downY) < 4;
      release();
      if (click) scene.pick(node);
    });
    g.addEventListener("pointercancel", release);
    g.addEventListener("lostpointercapture", release);
  }
  return () => cancelAnimationFrame(raf);
}

type ViewApi = { zoomBy: (factor: number) => void; reset: () => void };

/** What a click on the map says, in the same Thai sentences the rest of the app uses. */
function ExplainCard({ graph, picked, onClose }: { graph: KnowledgeGraph; picked: Picked; onClose: () => void }) {
  const sentence = (e: { from: string; to: string; type?: string; origin?: GraphEdge["origin"] }) => (
    <>
      {edgeSentence(e.from, e.type, e.to)}
      {isAiDraft(e) && <span style={{ color: "var(--ku-text-muted)", fontSize: 12 }}> · {AI_DRAFT_TEXT}</span>}
    </>
  );
  const node = picked.kind === "node" ? [graph.center, ...graph.nodes].find((n) => n.label === picked.label) : undefined;
  const related = picked.kind === "node" ? graph.edges.filter((e) => e.from === picked.label || e.to === picked.label) : [];
  // Lines that say how two things connect come first; "just related" ones would repeat one phrase, so they share a line.
  const specific = related.filter((e) => !isGenericPredicate(e.type));
  const vague = related.filter((e) => isGenericPredicate(e.type));
  const here = picked.kind === "node" ? picked.label : "";
  const otherEnd = (e: { from: string; to: string }) => humanLabel(e.from === here ? e.to : e.from);
  const neighbours = (label: string) => new Set(graph.edges.flatMap((e) => (e.from === label ? [e.to] : e.to === label ? [e.from] : [])));
  const shared = picked.kind === "edge"
    ? [...neighbours(picked.from)].filter((l) => l !== picked.to && neighbours(picked.to).has(l)).map(humanLabel)
    : [];
  const note = { fontSize: 12, color: "var(--ku-text-muted)" } as const;

  return (
    <section
      aria-label="คำอธิบายความสัมพันธ์"
      style={{
        position: "absolute", left: 12, bottom: 12, width: "min(340px, calc(100% - 24px))", maxHeight: "55%", overflowY: "auto",
        padding: "12px 14px", borderRadius: 12, border: "0.5px solid var(--ku-card-border)", background: "var(--ku-card-bg)",
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)", fontFamily: FONT, color: "var(--ku-text)",
      }}
    >
      <button type="button" aria-label="ปิดคำอธิบาย" onClick={onClose} style={{ position: "absolute", top: 6, right: 8, border: "none", background: "none", color: "var(--ku-text-muted)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
      {picked.kind === "node" ? (
        <>
          <p style={{ fontSize: 15, fontWeight: 600, paddingRight: 20 }}>
            {humanLabel(picked.label)}
            <span style={{ fontWeight: 400, ...note }}> · {TYPE_LABELS[node?.type ?? "topic"] ?? node?.type}</span>
          </p>
          {related.length === 0 ? (
            <p style={{ ...note, fontSize: 13, marginTop: 6 }}>ยังไม่มีเส้นความสัมพันธ์ของเรื่องนี้ในแผนที่</p>
          ) : (
            <>
              <p style={{ ...note, margin: "4px 0 6px" }}>เกี่ยวข้องกับเรื่องอื่น {related.length} เรื่อง</p>
              {specific.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                  {specific.map((e, i) => <li key={i} style={{ fontSize: 13, lineHeight: "20px" }}>• {sentence(e)}</li>)}
                </ul>
              )}
              {vague.length > 0 && (
                <p style={{ fontSize: 13, lineHeight: "20px", marginTop: specific.length ? 8 : 0 }}>
                  {specific.length > 0 ? "และเกี่ยวข้องกับ" : "เกี่ยวข้องกับ"} {[...new Set(vague.map(otherEnd))].join(", ")}
                  <span style={note}> · ข้อมูลยังไม่ระบุว่าเกี่ยวกันอย่างไร</span>
                </p>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: 14, lineHeight: "22px", paddingRight: 20 }}>{sentence(picked)}</p>
          {isGenericPredicate(picked.type) && <p style={{ ...note, marginTop: 6 }}>ข้อมูลระบุเพียงว่าเกี่ยวข้องกัน ยังไม่ระบุว่าเกี่ยวกันอย่างไร</p>}
          {shared.length > 0 && <p style={{ ...note, marginTop: 6 }}>ทั้งสองเรื่องนี้เชื่อมกับ: {shared.slice(0, 4).join(", ")}{shared.length > 4 ? ` และอีก ${shared.length - 4} เรื่อง` : ""}</p>}
          <p style={{ ...note, marginTop: 6 }}>ที่มา: {originText(picked.origin)}</p>
        </>
      )}
    </section>
  );
}

const controlButton = {
  width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--ku-card-border)", background: "var(--ku-bg)",
  color: "var(--ku-text-muted)", fontSize: 15, lineHeight: 1, cursor: "pointer",
} as const;

export default function KnowledgeGraphView({
  graph,
  height = 360,
  ariaLabel,
  wheelZoom = false,
}: {
  graph: KnowledgeGraph;
  height?: number | string;
  ariaLabel?: string;
  /** Let the mouse wheel and one-finger touch zoom/pan; off, the page keeps scrolling and only Ctrl/⌘+wheel or the buttons zoom. */
  wheelZoom?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<ViewApi | null>(null);
  const wheelRef = useRef(wheelZoom);
  const sceneRef = useRef<Scene | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);

  useEffect(() => {
    wheelRef.current = wheelZoom;
    // d3-zoom sets touch-action: none; without wheel zoom the page must still scroll under a finger.
    if (svgRef.current) svgRef.current.style.touchAction = wheelZoom ? "none" : "pan-y";
  }, [wheelZoom]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    setPicked(null); // a new graph: the old explanation no longer applies
    const { simNodes, simEdges } = layout(graph);
    if (simNodes.length === 0) return;
    const scene = renderGraph(svg, simNodes, simEdges, setPicked);
    sceneRef.current = scene;
    const clearOnBackground = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-node],[data-hit]")) scene.pick(null);
    };
    svg.addEventListener("click", clearOnBackground);

    let transform = zoomIdentity;
    let touched = false; // once the reader moves the view by hand, resizing no longer re-fits it
    const sel = select(svg);
    const zoomer: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_RANGE)
      .clickDistance(4) // a click with a little hand-shake is still a click, not a pan
      .filter((e: Event) => {
        if ((e.target as Element).closest?.("[data-node]")) return false;
        if (e.type === "wheel") return wheelRef.current || (e as WheelEvent).ctrlKey || (e as WheelEvent).metaKey;
        if (e.type.startsWith("touch")) return wheelRef.current || (e as TouchEvent).touches.length > 1;
        return !(e as MouseEvent).button;
      })
      .on("zoom", (e) => {
        transform = e.transform;
        scene.viewport.setAttribute("transform", transform.toString());
        scene.setZoom(transform.k);
        if (e.sourceEvent) touched = true;
      });
    sel.call(zoomer);
    svg.style.touchAction = wheelRef.current ? "none" : "pan-y";

    const fit = () => {
      const { width, height: h } = svg.getBoundingClientRect();
      if (!width || !h) return;
      const xs = simNodes.map((n) => n.x), ys = simNodes.map((n) => n.y);
      // Leave room for the names under the nodes, as the layout's label boxes do.
      const v = fitView(
        { x0: Math.min(...xs) - BOX_W / 2 - 8, x1: Math.max(...xs) + BOX_W / 2 + 8, y0: Math.min(...ys) - CENTER_R - 8, y1: Math.max(...ys) + BOX_H + 8 },
        width, h, undefined, ZOOM_RANGE[1],
      );
      sel.call(zoomer.transform, zoomIdentity.translate(v.x, v.y).scale(v.k));
      touched = false;
    };
    fit();
    const observer = new ResizeObserver(() => { if (!touched) fit(); });
    observer.observe(svg);

    viewRef.current = { zoomBy: (factor) => sel.call(zoomer.scaleBy, factor), reset: fit };
    const stopDrag = enableDrag(scene, simNodes, simEdges, (clientX, clientY) => {
      const r = svg.getBoundingClientRect();
      return transform.invert([clientX - r.left, clientY - r.top]);
    });

    return () => {
      stopDrag();
      svg.removeEventListener("click", clearOnBackground);
      sceneRef.current = null;
      observer.disconnect();
      sel.on(".zoom", null);
      viewRef.current = null;
    };
  }, [graph]);

  const close = () => sceneRef.current?.pick(null);
  return (
    <div style={{ position: "relative", width: "100%", height }} onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
      <svg ref={svgRef} role="img" aria-label={ariaLabel} style={{ width: "100%", height: "100%", display: "block" }} />
      {picked && <ExplainCard graph={graph} picked={picked} onClose={close} />}
      <div style={{ position: "absolute", right: 12, bottom: 4, display: "flex", gap: 6 }}>
        <button type="button" aria-label="ซูมเข้า" onClick={() => viewRef.current?.zoomBy(1.4)} style={controlButton}>+</button>
        <button type="button" aria-label="ซูมออก" onClick={() => viewRef.current?.zoomBy(1 / 1.4)} style={controlButton}>−</button>
        <button type="button" aria-label="รีเซ็ตมุมมอง" onClick={() => viewRef.current?.reset()} style={{ ...controlButton, width: "auto", padding: "0 10px", fontSize: 11 }}>รีเซ็ต</button>
      </div>
    </div>
  );
}
