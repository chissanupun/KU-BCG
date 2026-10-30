"use client";

import { useMemo, useState } from "react";
import type { GraphRagResult } from "@/lib/types";
import { graphSummary, pickDescription, TYPE_LABELS } from "@/lib/kgText";
import { FONT } from "../components/roadmap/tokens";
import KnowledgeGraphView from "./KnowledgeGraphView";
import RelationList from "./RelationList";

const button = {
  height: 28, padding: "0 10px", borderRadius: 6, border: "0.5px solid var(--ku-card-border)",
  background: "var(--ku-bg)", fontSize: 11, color: "var(--ku-text-muted)", cursor: "pointer", fontFamily: FONT,
} as const;

export default function MapTab({ result }: { result: GraphRagResult }) {
  const graph = result.knowledge_graph;
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Offer only the node types this graph actually has, so no filter chip is a no-op.
  const types = useMemo(() => [...new Set((graph?.nodes ?? []).map((n) => n.type))], [graph]);

  const center = graph?.center?.label ?? "";
  const edges = graph?.edges ?? [];
  const hiddenLabels = new Set((graph?.nodes ?? []).filter((n) => hidden.has(n.type) && n.label !== center).map((n) => n.label));
  const shownEdges = edges.filter((e) => !hiddenLabels.has(e.from) && !hiddenLabels.has(e.to));
  // One swatch per node type, in the colour that type is actually drawn with.
  const legend = useMemo(() => {
    const byType = new Map<string, string>();
    for (const n of [graph?.center, ...(graph?.nodes ?? [])]) if (n && !byType.has(n.type)) byType.set(n.type, n.color);
    return [...byType];
  }, [graph]);

  if (!graph || (graph.nodes ?? []).length === 0) {
    return <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)" }}>ยังไม่มีข้อมูลความสัมพันธ์สำหรับคำค้นนี้</p>;
  }

  const others = new Set((graph.nodes ?? []).map((n) => n.label)).size - ((graph.nodes ?? []).some((n) => n.label === center) ? 1 : 0);
  const summary = graphSummary(center, others, edges.length);

  const toggle = (type: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (!next.delete(type)) next.add(type);
      return next;
    });

  return (
    <div style={{ overflowWrap: "anywhere" }}>
      <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: "24px", color: "var(--ku-text)", marginBottom: 20 }}>
        {pickDescription(graph.description, summary)}
      </p>
      <div
        style={{
          borderRadius: expanded ? 0 : 20, overflow: "hidden", border: "0.5px solid var(--ku-card-border)",
          background: "var(--ku-card-bg)", position: expanded ? "fixed" : "relative", inset: expanded ? 0 : undefined,
          zIndex: expanded ? 50 : undefined, padding: "16px 0 10px", display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 1 }}>
          {types.length > 1 && (
            <button type="button" aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)} style={button}>
              ตัวกรอง{hidden.size > 0 ? ` (${hidden.size})` : ""}
            </button>
          )}
          <button type="button" onClick={() => setExpanded((v) => !v)} style={button}>
            {expanded ? "ย่อ" : "ขยาย"}
          </button>
        </div>

        {filterOpen && types.length > 1 && (
          <div
            role="group"
            aria-label="กรองประเภทโหนด"
            className="flex flex-wrap"
            style={{ gap: 12, padding: "0 12px 8px", marginRight: 150, fontFamily: FONT, fontSize: 12, color: "var(--ku-text)" }}
          >
            {types.map((type) => (
              <label key={type} className="flex items-center" style={{ gap: 4, cursor: "pointer" }}>
                <input type="checkbox" checked={!hidden.has(type)} onChange={() => toggle(type)} />
                {TYPE_LABELS[type] ?? type}
              </label>
            ))}
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <KnowledgeGraphView
            graph={graph}
            hiddenTypes={hidden}
            height={expanded ? "calc(100dvh - 80px)" : 360}
            ariaLabel={summary}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center" style={{ gap: "6px 16px", marginTop: 12, fontFamily: FONT, fontSize: 12, color: "var(--ku-text-muted)" }}>
        {legend.map(([type, color]) => (
          <span key={type} className="flex items-center" style={{ gap: 6 }}>
            <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
            {TYPE_LABELS[type] ?? type}
          </span>
        ))}
        <span>วงกลม = สิ่งที่เกี่ยวข้อง · เส้น = ความสัมพันธ์ (อ่านเป็นประโยคด้านล่าง)</span>
      </div>

      <RelationList edges={shownEdges} />
    </div>
  );
}
