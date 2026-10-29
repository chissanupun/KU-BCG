"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { default as ForceGraph2DType, ForceGraphMethods, NodeObject } from "react-force-graph-2d";
import { layoutMapNodes, type TopicMapEdge, type TopicMapNode } from "@/lib/topic";
import { FONT } from "../roadmap/tokens";

// react-force-graph touches `window` at import time (canvas/d3), so it can only
// run client-side — ssr:false is required, not just the "use client" directive.
// next/dynamic erases the component's generics, so it's cast back to the real
// (generic) type here rather than everywhere it's used below.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
}) as unknown as typeof ForceGraph2DType;

export const TYPE_LABELS: Record<string, string> = {
  topic: "หัวข้อ",
  faculty: "คณะ",
  course: "รายวิชา",
  bcg_pillar: "เสาหลัก BCG",
};

const CANVAS = { w: 606, h: 420 };

type GNode = NodeObject<{
  label: string;
  color: string;
  textColor?: string;
  type: string;
  degree: number;
  isCenter: boolean;
}>;
type GLink = { source: string; target: string; type: string };

/** Degree drives radius so hubs read as hubs; orphans stay small and recede. */
function radiusFor(degree: number, isCenter: boolean): number {
  if (isCenter) return 20;
  if (degree === 0) return 6;
  return Math.min(15, 9 + degree * 2);
}

/**
 * Curated labels carry their own line breaks. GraphRAG labels are free text —
 * often a full Thai subject name — so they are wrapped to fit inside the circle
 * and clipped rather than allowed to spill across the canvas.
 */
function toLines(label: string, radius: number): string[] {
  if (label.includes("\n")) return label.split("\n");

  const perLine = Math.max(8, Math.round(radius / 1.6));
  const maxLines = radius > 22 ? 3 : 2;
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

export default function MindMap({
  title,
  nodes,
  edges = [],
}: {
  title: string;
  nodes: TopicMapNode[];
  edges?: TopicMapEdge[];
}) {
  /** Curated maps ship complete Figma coordinates — those render pinned, unsimulated. */
  const isStatic = nodes.length > 0 && nodes.every((n) => n.cx !== undefined && n.cy !== undefined);

  const fgRef = useRef<ForceGraphMethods<GNode, GLink>>(undefined);
// The canvas is a fixed-size <canvas>, so it follows its box instead of overflowing a narrow column.
const boxRef = useRef<HTMLDivElement>(null);
const [canvasW, setCanvasW] = useState(CANVAS.w);
useEffect(() => {
  const el = boxRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => setCanvasW(Math.min(CANVAS.w, Math.floor(el.clientWidth))));
  ro.observe(el);
  return () => ro.disconnect();
}, []);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);

  const { graphData, edgeList } = useMemo(() => {
    const source = isStatic ? layoutMapNodes(nodes) : nodes;
    // The curated map is a mind map, not a relation graph: its spokes are the
    // design. Real graphs draw only their own edges, so nothing is fabricated
    // where actual relations exist.
    const links: TopicMapEdge[] =
      isStatic && edges.length === 0
        ? source.slice(1).map((n) => ({ from: source[0].label, to: n.label, type: "" }))
        : edges;

    const degree = new Map<string, number>();
    links.forEach((e) => {
      degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
      degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
    });

    const seen = new Set<string>();
    const gNodes: GNode[] = [];
    source.forEach((n, i) => {
      if (seen.has(n.label)) return;
      seen.add(n.label);
      const isCenter = i === 0;
      const deg = degree.get(n.label) ?? 0;
      const placed = n as ReturnType<typeof layoutMapNodes>[number];
      gNodes.push({
        id: n.label,
        label: n.label,
        color: n.color,
        textColor: n.textColor,
        type: n.type ?? "topic",
        degree: deg,
        isCenter,
        val: radiusFor(deg, isCenter),
        // Curated coordinates are fixed (fx/fy) so the design renders verbatim
        // instead of being pulled around by the force simulation.
        ...(isStatic ? { fx: placed.cx, fy: placed.cy, x: placed.cx, y: placed.cy } : {}),
      });
    });

    const gLinks: GLink[] = links
      .filter((e) => seen.has(e.from) && seen.has(e.to))
      .map((e) => ({ source: e.from, target: e.to, type: e.type }));

    return { graphData: { nodes: gNodes, links: gLinks }, edgeList: links };
  }, [nodes, edges, isStatic]);

  const types = useMemo(() => {
    const set = new Set<string>();
    graphData.nodes.forEach((n) => set.add(n.type));
    return Array.from(set);
  }, [graphData]);

  const active = focused ?? hovered;
  const neighbourhood = useMemo(() => {
    if (!active) return null;
    const ids = new Set<string>([active]);
    edgeList.forEach((e) => {
      if (e.from === active) ids.add(e.to);
      if (e.to === active) ids.add(e.from);
    });
    return ids;
  }, [active, edgeList]);

  const focusedNode = focused ? graphData.nodes.find((n) => n.id === focused) : undefined;
  const focusedEdges = focused ? edgeList.filter((e) => e.from === focused || e.to === focused) : [];

  const nodeOpacity = (n: GNode): number => {
    if (hiddenTypes.has(n.type)) return 0;
    if (!neighbourhood) return n.degree === 0 && !n.isCenter ? 0.45 : 1;
    return neighbourhood.has(n.id as string) ? 1 : 0.12;
  };

  const linkOpacity = (l: GLink): number => {
    const from = typeof l.source === "object" ? (l.source as GNode).id : l.source;
    const to = typeof l.target === "object" ? (l.target as GNode).id : l.target;
    if (hiddenTypes.size > 0) {
      const fromNode = graphData.nodes.find((n) => n.id === from);
      const toNode = graphData.nodes.find((n) => n.id === to);
      if (fromNode && hiddenTypes.has(fromNode.type)) return 0;
      if (toNode && hiddenTypes.has(toNode.type)) return 0;
    }
    if (!neighbourhood) return 1;
    return neighbourhood.has(from as string) && neighbourhood.has(to as string) ? 1 : 0.08;
  };

  return (
    <>
      <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "var(--ku-text)", marginBottom: 16 }}>
        {title}
      </p>
      <div
        ref={boxRef}
        style={{
          width: "100%", maxWidth: CANVAS.w, borderRadius: 12, overflow: "hidden",
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
            onClick={() => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) * 1.4, 200)}
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
            onClick={() => fgRef.current?.zoom((fgRef.current?.zoom() ?? 1) / 1.4, 200)}
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
            <button
              onClick={() => fgRef.current?.zoomToFit(300, 30)}
              style={{ fontSize: 11, fontFamily: FONT, color: "var(--ku-text-muted)", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
            >
              รีเซ็ตมุมมอง
            </button>
          </div>
        )}

        <ForceGraph2D
          ref={fgRef}
          width={canvasW}
          height={CANVAS.h}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          enableNodeDrag={!isStatic}
          cooldownTicks={isStatic ? 0 : 200}
          onEngineStop={() => fgRef.current?.zoomToFit(300, 30)}
          onNodeHover={(n) => setHovered((n as GNode | null)?.id as string | null)}
          onNodeClick={(n) => setFocused((prev) => (prev === n.id ? null : (n.id as string)))}
          onBackgroundClick={() => setFocused(null)}
          nodeVisibility={(n) => !hiddenTypes.has((n as GNode).type)}
          linkVisibility={(l) => linkOpacity(l as unknown as GLink) > 0}
          linkColor={(l) => {
            const lit = linkOpacity(l as unknown as GLink) === 1;
            return lit && neighbourhood ? "var(--ku-progress-fill)" : "rgba(59,99,71,0.3)";
          }}
          linkWidth={(l) => (linkOpacity(l as unknown as GLink) === 1 && neighbourhood ? 2 : 1.2)}
          linkLineDash={() => [6, 4]}
          linkLabel={(l) => (l as unknown as GLink).type}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GNode;
            const opacity = nodeOpacity(n);
            if (opacity === 0) return;
            const r = radiusFor(n.degree, n.isCenter);
            const x = n.x ?? 0;
            const y = n.y ?? 0;

            ctx.globalAlpha = opacity;
            if (active === n.id) {
              ctx.beginPath();
              ctx.arc(x, y, r + 2.5, 0, 2 * Math.PI);
              ctx.strokeStyle = n.color;
              ctx.globalAlpha = opacity * 0.5;
              ctx.lineWidth = 1.5 / globalScale;
              ctx.stroke();
              ctx.globalAlpha = opacity;
            }

            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI);
            ctx.fillStyle = n.color;
            ctx.fill();

            if (r * globalScale >= 9 || active === n.id) {
              const lines = toLines(n.label, Math.max(r, 9));
              const fontSize = Math.max((n.isCenter ? 5.5 : 4.5), r > 15 ? 5.5 : 4.5);
              ctx.font = `600 ${fontSize}px ${FONT}`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = n.textColor ?? "#fff";
              lines.forEach((line, li) => {
                ctx.fillText(line, x, y + (li - (lines.length - 1) / 2) * (fontSize + 1.5));
              });
            }
            ctx.globalAlpha = 1;
          }}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as GNode;
            const r = radiusFor(n.degree, n.isCenter);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x ?? 0, n.y ?? 0, r, 0, 2 * Math.PI);
            ctx.fill();
          }}
        />

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
                {edge.from === focusedNode.id ? "→ " : "← "}
                <span style={{ color: "var(--ku-text)" }}>{edge.type}</span>{" "}
                {edge.from === focusedNode.id ? edge.to : edge.from}
              </p>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
