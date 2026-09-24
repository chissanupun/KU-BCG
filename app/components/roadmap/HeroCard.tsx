"use client";

import { motion } from "framer-motion";
import { FONT, COLUMN_WIDTH, fadeIn } from "./tokens";
import ProgressBar from "./ProgressBar";

export default function HeroCard({
  estimatedHours,
  description,
  progress,
  completedCount,
  total,
}: {
  estimatedHours: string;
  description: string;
  progress?: number;
  /** Shown under the track once progress is trackable, i.e. `total` > 0. */
  completedCount?: number;
  total?: number;
}) {
  const countable = typeof total === "number" && total > 0;
  return (
    <motion.div
      {...fadeIn(0.06)}
      className="flex flex-col"
      style={{
        width: COLUMN_WIDTH, minHeight: 125,
        background: "var(--ku-overview-bg)", border: "0.5px solid var(--ku-overview-border)",
        borderRadius: 8, padding: "16px 24px",
      }}
    >
      {estimatedHours && (
        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text-muted)" }}>
          {estimatedHours}
        </p>
      )}
      {description && (
        <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 4 }}>
          {description}
        </p>
      )}
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        <ProgressBar progress={progress} />
        {countable && (
          <p style={{ fontFamily: FONT, fontSize: 12, lineHeight: "18px", color: "var(--ku-text-muted)", marginTop: 8 }}>
            {`เรียนจบแล้ว ${completedCount ?? 0}/${total} หัวข้อ · ${progress ?? 0}%`}
          </p>
        )}
      </div>
    </motion.div>
  );
}
