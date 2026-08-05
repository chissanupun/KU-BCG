"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Roadmap } from "@/lib/roadmap";
import Sidebar from "../Sidebar";
import { FONT, COLUMN_LEFT, COLUMN_WIDTH, COLUMN_TOP, fadeIn } from "./tokens";
import HeroCard from "./HeroCard";
import PhaseSection from "./PhaseSection";

/**
 * The single roadmap renderer. Both the curated default and a GraphRAG search
 * result flow through here — only the `roadmap` prop differs. `notice` swaps the
 * body for a loading/error message while keeping the chrome identical, so a
 * pending search never looks like a different page.
 */
export default function RoadmapView({ roadmap, notice }: { roadmap?: Roadmap | null; notice?: ReactNode }) {
  return (
    <div style={{ width: 1440, height: 900, display: "flex", overflow: "hidden", background: "var(--ku-bg)" }}>
      <div style={{ width: 195, height: 900, flexShrink: 0 }}>
        <Sidebar height={900} />
      </div>

      <div style={{ flex: 1, height: 900, overflowY: "auto", position: "relative" }}>
        <div style={{ position: "absolute", right: 13, top: 11, width: 114, height: 124, zIndex: 10 }}>
          <Image src="/ku-bcg.png" alt="KU Phumpanya" width={114} height={124} className="object-contain ku-logo" unoptimized />
        </div>

        {roadmap?.topic && (
          <motion.div
            {...fadeIn(0)}
            className="flex items-center justify-center"
            style={{
              position: "absolute", right: 349, top: 135, minWidth: 192, minHeight: 44, maxWidth: 420, padding: "0 16px",
              background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)", borderRadius: 8,
            }}
          >
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text)", textAlign: "center" }}>
              {roadmap.topic}
            </p>
          </motion.div>
        )}

        <div style={{ paddingLeft: COLUMN_LEFT, paddingTop: COLUMN_TOP, paddingBottom: 60, width: COLUMN_LEFT + COLUMN_WIDTH }}>
          {notice ? (
            <div style={{ fontFamily: FONT, fontSize: 14, lineHeight: "22px" }}>{notice}</div>
          ) : roadmap ? (
            <>
              <HeroCard
                estimatedHours={roadmap.estimatedHours}
                description={roadmap.description}
                progress={roadmap.progress}
              />

              {roadmap.phases.length > 0 ? (
                roadmap.phases.map((phase, i) => (
                  <PhaseSection key={`${phase.title}-${i}`} phase={phase} index={i} />
                ))
              ) : (
                <p style={{ fontFamily: FONT, fontSize: 14, color: "var(--ku-text-muted)", marginTop: 37 }}>
                  ยังไม่มีเส้นทางการเรียนรู้สำหรับหัวข้อนี้
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
