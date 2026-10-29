"use client";

import { motion } from "framer-motion";
import { resultTags } from "@/lib/resultView";
import type { GraphRagResult } from "@/lib/types";
import { FONT, fadeIn } from "../components/roadmap/tokens";
import EvidenceCard from "./EvidenceCard";

const chip = (pillar: boolean) =>
  ({
    fontFamily: FONT, fontSize: 12, fontWeight: pillar ? 600 : 400, color: "var(--ku-text)",
    background: pillar ? "var(--ku-nav-active-bg)" : "var(--ku-tag-bg)",
    border: `0.5px solid ${pillar ? "var(--ku-nav-active-border)" : "var(--ku-tag-border)"}`,
    borderRadius: 6, padding: "3px 10px",
  }) as const;

const divider = <div style={{ width: "100%", height: 1, background: "var(--ku-divider-line)", opacity: 0.5, margin: "22px 0" }} />;

export default function OverviewTab({ result }: { result: GraphRagResult }) {
  const { bcgPillars, faculties } = resultTags(result);
  const { intro, analogy, research_basis, expert } = result.overview ?? {};
  const evidence = result.evidence ?? [];

  return (
    <div style={{ overflowWrap: "anywhere" }}>
      {intro && (
        <motion.div
          {...fadeIn(0.03)}
          style={{ background: "var(--ku-overview-bg)", border: "0.5px solid var(--ku-overview-border)", borderRadius: 8, padding: "16px 24px" }}
        >
          <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: "24px", color: "var(--ku-text)" }}>{intro}</p>
        </motion.div>
      )}

      {(bcgPillars.length > 0 || faculties.length > 0) && (
        <motion.div {...fadeIn(0.06)} className="flex flex-wrap" style={{ gap: 8, marginTop: 16 }} aria-label="หมวด BCG และคณะที่เกี่ยวข้อง">
          {bcgPillars.map((label) => (
            <span key={`p-${label}`} style={chip(true)}>{label}</span>
          ))}
          {faculties.map((label) => (
            <span key={`f-${label}`} style={chip(false)}>{label}</span>
          ))}
        </motion.div>
      )}

      {analogy && (
        <motion.p {...fadeIn(0.08)} style={{ fontFamily: FONT, fontSize: 16, lineHeight: "24px", color: "var(--ku-text)", marginTop: 20 }}>
          {analogy}
        </motion.p>
      )}
      {research_basis && (
        <>
          {divider}
          <motion.p {...fadeIn(0.1)} style={{ fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)" }}>
            {research_basis}
          </motion.p>
        </>
      )}
      {expert && (
        <>
          {divider}
          <motion.p {...fadeIn(0.12)} style={{ fontFamily: FONT, fontSize: 14, lineHeight: "24px", color: "var(--ku-text)" }}>
            {expert}
          </motion.p>
        </>
      )}

      <section style={{ marginTop: 32 }}>
        <motion.h2 {...fadeIn(0.14)} style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "var(--ku-text)", marginBottom: 12 }}>
          หลักฐานจากแหล่งข้อมูล KU{evidence.length > 0 ? ` (${evidence.length})` : ""}
        </motion.h2>
        {evidence.length > 0 ? (
          <div className="flex flex-col" style={{ gap: 12 }}>
            {evidence.map((item, i) => (
              <EvidenceCard key={`${item.url}-${i}`} item={item} index={i} />
            ))}
          </div>
        ) : (
          <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)" }}>ยังไม่มีหลักฐานอ้างอิงสำหรับคำค้นนี้</p>
        )}
      </section>
    </div>
  );
}
