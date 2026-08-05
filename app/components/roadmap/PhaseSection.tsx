"use client";

import { motion } from "framer-motion";
import type { RoadmapPhase } from "@/lib/roadmap";
import { PRIMARY, FONT, CARD_GAP, fadeIn } from "./tokens";
import BubbleCard from "./BubbleCard";

export default function PhaseSection({ phase, index }: { phase: RoadmapPhase; index: number }) {
  const base = 0.14 + index * 0.07;

  return (
    <div style={{ marginTop: index === 0 ? 37 : 35 }}>
      <div className="flex items-center" style={{ gap: 15 }}>
        <motion.div
          {...fadeIn(base)}
          className="flex items-center justify-center shrink-0"
          style={{
            minWidth: 82, height: 30, padding: "0 10px",
            background: PRIMARY, borderRadius: 6, boxShadow: "var(--ku-badge-shadow)",
          }}
        >
          <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
            Phase {index + 1}
          </span>
        </motion.div>

        <motion.p
          {...fadeIn(base)}
          style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, lineHeight: "24px", color: "var(--ku-text)" }}
        >
          {phase.title}
        </motion.p>
      </div>

      {phase.description && (
        <motion.p
          {...fadeIn(base + 0.04)}
          style={{
            width: 448, marginTop: 15,
            fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)",
          }}
        >
          {phase.description}
        </motion.p>
      )}

      <div className="flex flex-wrap items-stretch" style={{ gap: CARD_GAP, marginTop: 32 }}>
        {phase.cards.map((card, ci) => (
          <BubbleCard key={`${card.title}-${ci}`} card={card} delay={base + 0.06 + ci * 0.055} />
        ))}
      </div>
    </div>
  );
}
