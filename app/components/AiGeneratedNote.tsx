import { portalLinks } from "@/lib/resultView";
import type { EvidenceItem } from "@/lib/types";
import AiBadge from "./AiBadge";
import { FONT } from "./roadmap/tokens";

/**
 * A banner above text an AI wrote (not copied from a source). It names the portals the text was written
 * from, as links, so a reader can check it against the original.
 */
export default function AiGeneratedNote({ what, evidence, model }: { what: string; evidence?: EvidenceItem[]; model?: string }) {
  const portals = portalLinks(evidence);
  return (
    <div
      data-testid="ai-generated-note"
      role="note"
      style={{
        display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px", marginBottom: 16, padding: "10px 14px",
        borderRadius: 8, background: "var(--ku-ai-bg)", border: "1px solid var(--ku-ai-border)",
        fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text)",
      }}
    >
      <AiBadge text="สร้างโดย AI" testId="ai-note-badge" title={model ? `สร้างโดย ${model}` : undefined} />
      <span style={{ minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>
        {what}เรียบเรียงโดย AI
        {portals.length > 0 ? (
          <>
            {" "}จากข้อมูลของ{" "}
            {portals.map((p, i) => (
              <span key={p.href + p.label}>
                {i > 0 && ", "}
                <a href={p.href} target="_blank" rel="noopener noreferrer" style={{ color: "var(--ku-text)", fontWeight: 600, textDecoration: "underline" }}>{p.label} ↗</a>
              </span>
            ))}
            . AI อาจสรุปคลาดเคลื่อน ตรวจกับแหล่งต้นทางก่อนนำไปใช้
          </>
        ) : (
          " ยังไม่มีแหล่งอ้างอิงจากพอร์ทัลสำหรับคำค้นนี้ โปรดตรวจสอบก่อนนำไปใช้"
        )}
      </span>
    </div>
  );
}
