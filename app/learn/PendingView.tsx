"use client";

import type { EvidenceItem } from "@/lib/types";
import { FONT } from "../components/roadmap/tokens";
import EvidenceCard from "./EvidenceCard";

const block = (height: number, width: string = "100%") => (
  <div className="animate-pulse" style={{ height, width, borderRadius: 8, background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)" }} />
);

/**
 * Shown while a search runs. When the backend answered early (contract C2) the
 * evidence it already has is listed above the skeleton of the part still being written.
 */
export default function PendingView({ evidence = [], pending = false }: { evidence?: EvidenceItem[]; pending?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <p style={{ fontFamily: FONT, fontSize: 14, color: "var(--ku-text-muted)", marginBottom: 20 }}>
        {pending ? "กำลังสรุปคำตอบ แสดงหลักฐานที่พบแล้วก่อน" : "กำลังค้นหา..."}
      </p>
      <div className="flex flex-col" style={{ gap: 12 }}>
        {block(64)}
        {block(120)}
        {block(16, "70%")}
      </div>
      {evidence.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "var(--ku-text)", marginBottom: 12 }}>
            หลักฐานจากแหล่งข้อมูล KU ({evidence.length})
          </h2>
          <div className="flex flex-col" style={{ gap: 12 }}>
            {evidence.map((item, i) => (
              <EvidenceCard key={`${item.url}-${i}`} item={item} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
