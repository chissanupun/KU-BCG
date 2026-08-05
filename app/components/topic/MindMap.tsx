"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { layoutMapNodes, type TopicMapEdge, type TopicMapNode } from "@/lib/topic";
import { FONT } from "../roadmap/tokens";
import { buildGraph, seedPositions, tick, CANVAS, TYPE_LABELS, type SimNode } from "./graphSim";

/**
 * Curated labels carry their own line breaks. GraphRAG labels are free text —
 * often a full Thai subject name — so they are wrapped to fit inside the circle
 * and clipped rather than allowed to spill across the canvas.
 */
function toLines(label: string, radius: number): string[] {
  if (label.includes("\n")) return label.split("\n");

  const perLine = Math.max(8, Math.round(radius / 3.2));
  const maxLines = radius > 45 ? 3 : 2;
  // Relation entities are snake_case ("water_quality"), so underscores are word
  // breaks — splitting on whitespace alone chopped them mid-word.
  const words = label.split(/[\s_]+/).filter(Boolean);
  const lines: string[] = [];

  for (const word of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && last.length + 1 + word.length <= perLine) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else if (word.length > perLine) {
      for (let i = 0; i < word.length; i += perLine) lines.push(word.slice(i, i + perLine));
    } else {
      lines.push(word);
    }
  }

  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(perLine - 1, 1))}…`;
  return kept;
}

const ZOOM_STEP = 1.25;
const ZOOM_MIN = 0.35;
const ZOOM_MAX = 3;
const SETTLE_ENERGY = 0.5;
const MAX_FRAMES = 150;
/** Physics steps per painted frame — see the note in the animation loop. */
const STEPS_PER_FRAME = 4;

type Viewport = { x: number; y: number; w: number; h: number };
const INITIAL_VIEW: Viewport = { x: 0, y: 0, w: CANVAS.w, h: CANVAS.h };

export default function MindMap({
  title,
  nodes,
  edges = [],
}: {
  title: string;
  nodes: TopicMapNode[];
  edges?: TopicMapEdge[];
}) {
  /** Curated maps ship complete Figma coordinates — those render verbatim, unsimulated. */
  const isStatic = nodes.length > 0 && nodes.every((n) => n.cx !== undefined && n.cy !== undefined);

  const graph = useMemo(() => {
    if (isStatic) {
      const placed = layoutMapNodes(nodes);
      // The curated map is a mind map, not a relation graph: its spokes are the
      // design. Real graphs draw only their own edges, so nothing is fabricated
      // where actual relations exist.
      const spokes =
        edges.length > 0
          ? edges
          : placed.slice(1).map((n) => ({ from: placed[0].label, to: n.label, type: "" }));
      return buildGraph(placed, spokes);
    }
    const built = buildGraph(nodes, edges);
    seedPositions(built.connected, built.orphans);
    return built;
  }, [nodes, edges, isStatic]);

  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const [view, setView] = useState<Viewport>(INITIAL_VIEW);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef(0);
  const framesRef = useRef(0);
  const dragRef = useRef<{ id: string } | null>(null);
  const panRef = useRef<{ x: number; y: number; view: Viewport } | null>(null);

  /** Runs the simulation until kinetic energy settles; restarted by any interaction. */
  const kick = useCallback(() => {
    if (isStatic) return;
    framesRef.current = 0;
    if (rafRef.current) return;

    const step = () => {
      // Integration is O(n²) over a few dozen nodes and costs far less than the
      // React commit, so several steps per painted frame converge in a fraction
      // of the wall time without dropping the animation.
      let energy = 0;
      for (let i = 0; i < STEPS_PER_FRAME; i++) energy = tick(graph.nodes, graph.edges);
      framesRef.current += 1;
      rerender();
      if (energy > SETTLE_ENERGY && framesRef.current < MAX_FRAMES) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [graph, isStatic]);

  useEffect(() => {
    setView(INITIAL_VIEW);
    setHovered(null);
    setFocused(null);
    kick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [kick]);

  const types = useMemo(() => {
    const set = new Set<string>();
    graph.nodes.forEach((n) => set.add(n.type));
    return Array.from(set);
  }, [graph]);

  const visible = useCallback((n: SimNode) => !hiddenTypes.has(n.type), [hiddenTypes]);

  /** Neighbourhood of the active node — drives the dim-everything-else highlight. */
  const active = focused ?? hovered;
  const neighbourhood = useMemo(() => {
    if (!active) return null;
    const ids = new Set<string>([active]);
    graph.edges.forEach((e) => {
      if (e.from.id === active) ids.add(e.to.id);
      if (e.to.id === active) ids.add(e.from.id);
    });
    return ids;
  }, [active, graph]);

  const focusedNode = focused ? graph.nodes.find((n) => n.id === focused) : undefined;
  const focusedEdges = useMemo(
    () => (focused ? graph.edges.filter((e) => e.from.id === focused || e.to.id === focused) : []),
    [focused, graph],
  );

  const toSvgPoint = (clientX: number, clientY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: view.x + ((clientX - rect.left) / rect.width) * view.w,
      y: view.y + ((clientY - rect.top) / rect.height) * view.h,
    };
  };

  const zoom = (factor: number, originX?: number, originY?: number) => {
    setView((v) => {
      // A larger factor means zooming in, i.e. a *smaller* viewBox.
      const scale = Math.min(Math.max((CANVAS.w / v.w) * factor, ZOOM_MIN), ZOOM_MAX);
      const w = CANVAS.w / scale;
      const h = CANVAS.h / scale;
      const ox = originX ?? v.x + v.w / 2;
      const oy = originY ?? v.y + v.h / 2;
      return { x: ox - ((ox - v.x) * w) / v.w, y: oy - ((oy - v.y) * h) / v.h, w, h };
    });
  };

  const onPointerDownNode = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { id };
    const node = graph.nodes.find((n) => n.id === id);
    if (node && !isStatic) node.pinned = true;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current) {
      const node = graph.nodes.find((n) => n.id === dragRef.current!.id);
      if (node) {
        const p = toSvgPoint(e.clientX, e.clientY);
        node.x = p.x;
        node.y = p.y;
        node.vx = 0;
        node.vy = 0;
        kick();
        rerender();
      }
      return;
    }
    if (panRef.current) {
      const start = panRef.current;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - start.x) / rect.width) * start.view.w;
      const dy = ((e.clientY - start.y) / rect.height) * start.view.h;
      setView({ ...start.view, x: start.view.x - dx, y: start.view.y - dy });
    }
  };

  const endPointer = () => {
    dragRef.current = null;
    panRef.current = null;
  };

  const nodeOpacity = (n: SimNode) => {
    if (!neighbourhood) return n.degree === 0 && !n.isCenter ? 0.45 : 1;
    return neighbourhood.has(n.id) ? 1 : 0.12;
  };

  return (
    <>
      <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "var(--ku-text)", marginBottom: 16 }}>
        {title}
      </p>
      <div
        style={{
          width: 606, borderRadius: 12, overflow: "hidden",
          border: "0.5px solid var(--ku-card-border)", background: "var(--ku-card-bg)",
          padding: "16px 0 10px", position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 2 }}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            aria-expanded={filterOpen}
            style={{
              height: 28, paddingLeft: 10, paddingRight: 10, borderRadius: 6,
              border: "0.5px solid var(--ku-card-border)",
              background: filterOpen || hiddenTypes.size > 0 ? "var(--ku-nav-active-bg)" : "var(--ku-bg)",
              fontSize: 11, color: "var(--ku-text-muted)", cursor: "pointer", fontFamily: FONT,
            }}
          >
            กรอง{hiddenTypes.size > 0 ? ` (${types.length - hiddenTypes.size}/${types.length})` : ""}
          </button>
          <button
            onClick={() => zoom(ZOOM_STEP)}
            aria-label="ซูมเข้า"
            style={{
              height: 28, paddingLeft: 10, paddingRight: 10, borderRadius: 6,
              border: "0.5px solid var(--ku-card-border)", background: "var(--ku-bg)",
              fontSize: 11, color: "var(--ku-text-muted)", cursor: "pointer", fontFamily: FONT,
            }}
          >
            ซูมเข้า
          </button>
          <button
            onClick={() => zoom(1 / ZOOM_STEP)}
            aria-label="ซูมออก"
            style={{
              height: 28, paddingLeft: 10, paddingRight: 10, borderRadius: 6,
              border: "0.5px solid var(--ku-card-border)", background: "var(--ku-bg)",
              fontSize: 11, color: "var(--ku-text-muted)", cursor: "pointer", fontFamily: FONT,
            }}
          >
            ซูมออก
          </button>
        </div>

        {filterOpen && (
          <div
            style={{
              position: "absolute", top: 46, right: 12, zIndex: 3,
              background: "var(--ku-bg)", border: "0.5px solid var(--ku-card-border)",
              borderRadius: 8, padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6,
            }}
          >
            {types.map((type) => (
              <label
                key={type}
                style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, fontFamily: FONT, color: "var(--ku-text-muted)", cursor: "pointer" }}
              >
                <input
                  type="checkbox"
                  checked={!hiddenTypes.has(type)}
                  onChange={() =>
                    setHiddenTypes((prev) => {
                      const next = new Set(prev);
                      if (next.has(type)) next.delete(type);
                      else next.add(type);
                      return next;
                    })
                  }
                />
                {TYPE_LABELS[type] ?? type}
              </label>
            ))}
            {view !== INITIAL_VIEW && (
              <button
                onClick={() => setView(INITIAL_VIEW)}
                style={{ fontSize: 11, fontFamily: FONT, color: "var(--ku-text-muted)", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
                รีเซ็ตมุมมอง
              </button>
            )}
          </div>
        )}

        <svg
          ref={svgRef}
          width={CANVAS.w}
          height={CANVAS.h}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          style={{ display: "block", touchAction: "none", cursor: isStatic ? "default" : "grab" }}
          onPointerDown={(e) => {
            panRef.current = { x: e.clientX, y: e.clientY, view };
          }}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerLeave={() => {
            endPointer();
            setHovered(null);
          }}
          onWheel={(e) => {
            const p = toSvgPoint(e.clientX, e.clientY);
            zoom(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, p.x, p.y);
          }}
          onClick={() => setFocused(null)}
        >
          {graph.edges.map((edge, i) => {
            if (!visible(edge.from) || !visible(edge.to)) return null;
            const lit = !neighbourhood || (neighbourhood.has(edge.from.id) && neighbourhood.has(edge.to.id));
            const mx = (edge.from.x + edge.to.x) / 2;
            const my = (edge.from.y + edge.to.y) / 2;
            return (
              <g key={`${edge.from.id}-${edge.to.id}-${i}`} opacity={lit ? 1 : 0.08}>
                <line
                  x1={edge.from.x} y1={edge.from.y}
                  x2={edge.to.x} y2={edge.to.y}
                  stroke={lit && neighbourhood ? "var(--ku-progress-fill)" : "rgba(59,99,71,0.3)"}
                  strokeWidth={lit && neighbourhood ? 2 : 1.5}
                  strokeDasharray="6,4"
                />
                {neighbourhood && lit && (
                  <text
                    x={mx} y={my - 4}
                    textAnchor="middle"
                    fontSize={8.5}
                    fontFamily={FONT}
                    fill="var(--ku-text-muted)"
                  >
                    {edge.type}
                  </text>
                )}
              </g>
            );
          })}

          {graph.nodes.map((node) => {
            if (!visible(node)) return null;
            const isActive = active === node.id;
            const showLabel = node.r >= 18 || isActive;
            const lines = toLines(node.label, Math.max(node.r, 18));
            return (
              <g
                key={node.id}
                opacity={nodeOpacity(node)}
                style={{ cursor: "pointer", transition: "opacity 0.18s ease" }}
                onPointerDown={(e) => onPointerDownNode(e, node.id)}
                onPointerEnter={() => setHovered(node.id)}
                onPointerLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocused((prev) => (prev === node.id ? null : node.id));
                }}
              >
                <title>{`${node.label}${node.type ? ` (${TYPE_LABELS[node.type] ?? node.type})` : ""} · ${node.degree} ความสัมพันธ์`}</title>
                {isActive && (
                  <circle cx={node.x} cy={node.y} r={node.r + 5} fill="none" stroke={node.color} strokeWidth={1.5} opacity={0.5} />
                )}
                <circle cx={node.x} cy={node.y} r={node.r} fill={node.color} />
                {showLabel &&
                  lines.map((line, li) => (
                    <text
                      key={li}
                      x={node.x}
                      y={node.y + (li - (lines.length - 1) / 2) * 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={node.r > 45 ? 11 : 9.5}
                      fontWeight={600}
                      fill={node.textColor}
                      fontFamily={FONT}
                      style={{ pointerEvents: "none" }}
                    >
                      {line}
                    </text>
                  ))}
              </g>
            );
          })}
        </svg>

        {focusedNode && (
          <div
            style={{
              position: "absolute", left: 12, bottom: 10, right: 12, zIndex: 2,
              background: "var(--ku-bg)", border: "0.5px solid var(--ku-card-border)",
              borderRadius: 8, padding: "10px 12px", fontFamily: FONT,
            }}
          >
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ku-text)", marginBottom: 2 }}>
              {focusedNode.label}
            </p>
            <p style={{ fontSize: 11, color: "var(--ku-text-muted)" }}>
              {TYPE_LABELS[focusedNode.type] ?? focusedNode.type} · {focusedEdges.length} ความสัมพันธ์
            </p>
            {focusedEdges.slice(0, 4).map((edge, i) => (
              <p key={i} style={{ fontSize: 11, color: "var(--ku-text-muted)", marginTop: 3 }}>
                {edge.from.id === focusedNode.id ? "→ " : "← "}
                <span style={{ color: "var(--ku-text)" }}>{edge.type}</span>{" "}
                {edge.from.id === focusedNode.id ? edge.to.label : edge.from.label}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
