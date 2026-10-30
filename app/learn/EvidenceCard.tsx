"use client";

import { motion } from "framer-motion";
import { SOURCE_LABELS, safeHref } from "@/lib/resultView";
import type { EvidenceItem } from "@/lib/types";
import { FONT, fadeIn } from "../components/roadmap/tokens";

export default function EvidenceCard({ item, index }: { item: EvidenceItem; index: number }) {
  const href = safeHref(item.url);
  return (
    <motion.article
      {...fadeIn(0.16 + index * 0.02)}
      style={{
        background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)",
        borderRadius: 10, padding: "16px 20px", overflowWrap: "anywhere",
      }}
    >
      <span
        style={{
          display: "inline-block", fontFamily: FONT, fontSize: 12, color: "var(--ku-text)",
          background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)", borderRadius: 6, padding: "2px 8px",
        }}
      >
        {SOURCE_LABELS[item.source] ?? item.source}
      </span>
      <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "var(--ku-text)", marginTop: 8 }}>{item.title}</p>
      {item.source === "KU_NonDegree" && (
        <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 6 }}>
          จับคู่กับหัวข้อจากชื่อชุดวิชา (ยังไม่ได้ตรวจเนื้อหา)
        </p>
      )}
      {item.snippet && (
        <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 6 }}>
          {item.snippet}
        </p>
      )}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          style={{
            display: "inline-block", marginTop: 12, fontFamily: FONT, fontSize: 13, fontWeight: 500,
            color: "var(--ku-text)", border: "0.5px solid var(--ku-nav-active-border)", borderRadius: 6, padding: "4px 12px", textDecoration: "none",
          }}
        >
          ดูแหล่งข้อมูลต้นทาง →
        </a>
      )}
    </motion.article>
  );
}
