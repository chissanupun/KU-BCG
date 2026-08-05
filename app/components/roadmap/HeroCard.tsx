"use client";

import { motion } from "framer-motion";
import { FONT, COLUMN_WIDTH, fadeIn } from "./tokens";
import ProgressBar from "./ProgressBar";

export default function HeroCard({
  estimatedHours,
  description,
  progress,
}: {
  estimatedHours: string;
  description: string;
  progress?: number;
}) {
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
      </div>
    </motion.div>
  );
}
