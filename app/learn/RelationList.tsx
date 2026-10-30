"use client";

import { useState } from "react";
import { AI_DRAFT_TEXT, edgeSentence, isAiDraft } from "@/lib/kgText";
import { FONT } from "../components/roadmap/tokens";

/** The graph's edges as sentences: the same facts as the lines, readable without tracing them. */
export default function RelationList({ edges, max = 8 }: { edges: { from: string; to: string; type?: string; origin?: string }[]; max?: number }) {
  const [showAll, setShowAll] = useState(false);
  // A sentence is a draft only if every edge saying it is; verified ones come first so "show fewer" never hides them behind drafts.
  const draft = new Map<string, boolean>();
  for (const e of edges) { const s = edgeSentence(e.from, e.type, e.to); draft.set(s, (draft.get(s) ?? true) && isAiDraft(e)); }
  const sentences = [...draft.keys()].sort((a, b) => Number(draft.get(a)) - Number(draft.get(b)));

  if (sentences.length === 0) {
    return <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)", marginTop: 16 }}>ยังไม่มีเส้นความสัมพันธ์ระหว่างหัวข้อ</p>;
  }

  const visible = showAll ? sentences : sentences.slice(0, max);
  return (
    <section aria-labelledby="relations-title" style={{ marginTop: 20 }}>
      <h3 id="relations-title" style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "var(--ku-text)", marginBottom: 8 }}>
        ความสัมพันธ์ในแผนที่นี้
      </h3>
      <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0 }}>
        {visible.map((sentence) => (
          <li key={sentence} style={{ fontFamily: FONT, fontSize: 14, lineHeight: "22px", color: "var(--ku-text)" }}>
            • {sentence}
            {draft.get(sentence) && <span data-testid="ai-draft" style={{ color: "var(--ku-text-muted)", fontSize: 12 }}> · {AI_DRAFT_TEXT}</span>}
          </li>
        ))}
      </ul>
      {sentences.length > max && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          style={{
            marginTop: 8, fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)", background: "none",
            border: "none", padding: 0, cursor: "pointer", textDecoration: "underline",
          }}
        >
          {showAll ? "แสดงน้อยลง" : `ดูทั้งหมด (${sentences.length})`}
        </button>
      )}
    </section>
  );
}
