"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { Roadmap } from "@/lib/roadmap";
import type { RoadmapProgress } from "@/lib/useLearningProgress";
import AppShell from "../AppShell";
import { FONT, COLUMN_WIDTH, fadeIn } from "./tokens";
import HeroCard from "./HeroCard";
import PhaseSection from "./PhaseSection";

/**
 * The single roadmap renderer. Both the curated default and a GraphRAG search
 * result flow through here — only the `roadmap` prop differs. `notice` swaps the
 * body for a loading/error message while keeping the chrome identical, so a
 * pending search never looks like a different page.
 */
export default function RoadmapView({
  roadmap,
  notice,
  header,
  activeTab,
  body,
  progress,
}: {
  roadmap?: Roadmap | null;
  notice?: ReactNode;
  /** Replaces the topic badge: the result page puts its title and tab bar here. */
  header?: ReactNode;
  /** Key of the selected tab in `header`, so the panel can name the tab that labels it. */
  activeTab?: string;
  /** Replaces the hero card and phases, e.g. the overview or map tab. */
  body?: ReactNode;
  /**
   * Live completion state. Absent for the curated roadmap, which has no stored
   * row — that one keeps whatever static `roadmap.progress` it declares.
   */
  progress?: RoadmapProgress;
}) {
  // The shell tracks the viewport rather than the 900px design canvas, and the
  // content column is fluid: capped at the mockup's 569px, inset 16vw (max 231px)
  // from the left like the original, never wider than the screen.
  const showPill = !header && Boolean(roadmap?.topic);
  return (
    <AppShell>
      <div className={`pb-[60px]! ${showPill ? "pt-6! min-[1025px]:pt-[135px]!" : "pt-6! min-[1025px]:pt-[211px]!"}`}>
        <div style={{ marginLeft: "clamp(24px, 16vw, 231px)", marginRight: 24, maxWidth: COLUMN_WIDTH }}>
          {showPill && (
            <motion.div
              {...fadeIn(0)}
              className="flex items-center justify-center"
              style={{
                minHeight: 44, maxWidth: "100%", padding: "0 16px", marginBottom: 20, width: "fit-content",
                background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)", borderRadius: 8,
              }}
            >
              <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text)", textAlign: "center" }}>
                {roadmap!.topic}
              </p>
            </motion.div>
          )}

          {notice ? (
            <div style={{ fontFamily: FONT, fontSize: 14, lineHeight: "22px" }}>{notice}</div>
          ) : roadmap ? (
            <>
              {header}
              <div id={header ? "result-panel" : undefined} role={header ? "tabpanel" : undefined} aria-labelledby={header && activeTab ? `tab-${activeTab}` : undefined}>
                {body ?? (
                  <>
                    <HeroCard
                      estimatedHours={roadmap.estimatedHours}
                      description={roadmap.description}
                      progress={progress ? progress.percent : roadmap.progress}
                      completedCount={progress?.completedCount}
                      total={progress?.total}
                    />

                    {roadmap.phases.length > 0 ? (
                      roadmap.phases.map((phase, i) => (
                        <PhaseSection key={`${phase.title}-${i}`} phase={phase} index={i} progress={progress} />
                      ))
                    ) : (
                      <p style={{ fontFamily: FONT, fontSize: 14, color: "var(--ku-text-muted)", marginTop: 37 }}>
                        ยังไม่มีเส้นทางการเรียนรู้สำหรับหัวข้อนี้
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
