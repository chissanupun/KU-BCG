"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { TopicDetail } from "@/lib/topic";
import Sidebar from "../Sidebar";
import { PRIMARY, FONT, fadeIn } from "../roadmap/tokens";
import CompleteToggle from "../roadmap/CompleteToggle";
import MindMap from "./MindMap";

/**
 * Progress for the roadmap this card belongs to. `completed` is this card alone;
 * the percentage and counts cover the whole roadmap, so the bar here reads the
 * same as the one on /learn.
 */
export type TopicProgress = {
  percent?: number;
  completedCount: number;
  total: number;
  completed: boolean;
  onToggle: () => void;
};

/**
 * The single topic-detail renderer. The curated default and any GraphRAG card
 * flow through here — only the `detail` prop differs. `notice` swaps the body for
 * a loading/error message while keeping the chrome identical.
 *
 * Blocks with no data (research, expert, tags, mind map) are omitted rather than
 * rendered empty, the same rule the roadmap's progress track follows.
 */
export default function TopicView({
  detail,
  notice,
  progress,
}: {
  detail?: TopicDetail | null;
  notice?: ReactNode;
  /** Absent on curated topics, which have no stored roadmap to record against. */
  progress?: TopicProgress;
}) {
  // Collapsed by default: the shortened body is the point, and a card that opens
  // already expanded would be the wall of text it replaced.
  const [showFull, setShowFull] = useState(false);
  const paragraphs = (showFull && detail?.bodyFull ? detail.bodyFull : detail?.body) ?? [];
  return (
    <div style={{ width: 1440, height: "100dvh", display: "flex", overflow: "hidden", background: "var(--ku-bg)" }}>
      <div style={{ width: 195, height: "100dvh", flexShrink: 0 }}>
        <Sidebar height="100dvh" />
      </div>

      <div style={{ flex: 1, height: "100dvh", overflowY: "auto", position: "relative", fontFamily: FONT }}>
        <div style={{ position: "absolute", right: 18, top: 10, width: 114, height: 124, zIndex: 10 }}>
          <Image src="/ku-bcg.png" alt="KU Phumpanya" width={114} height={124} className="object-contain ku-logo" unoptimized />
        </div>

        {detail?.badge && !notice && (
          <motion.div
            {...fadeIn(0)}
            style={{
              position: "absolute", left: 731, top: 134, minHeight: 44,
              ...(detail.badgeWidth
                ? { width: detail.badgeWidth }
                : { minWidth: 139, maxWidth: 420, padding: "0 16px" }),
              background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text)", textAlign: "center" }}>
              {detail.badge}
            </p>
          </motion.div>
        )}

        <div style={{ paddingLeft: 226, paddingRight: 36, paddingTop: 44, paddingBottom: 60 }}>
          {notice ? (
            <div style={{ marginTop: 165, fontFamily: FONT, fontSize: 14, lineHeight: "22px" }}>{notice}</div>
          ) : detail ? (
            <>
              <motion.div
                {...fadeIn(0.06)}
                style={{
                  width: 569, marginTop: 165, marginBottom: 20,
                  background: "var(--ku-overview-bg)", border: "0.5px solid var(--ku-overview-border)", borderRadius: 8,
                  padding: "25px 24px 16px", position: "relative",
                }}
              >
                {detail.estimatedHours && (
                  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text-muted)" }}>
                    {detail.estimatedHours}
                  </p>
                )}
                {detail.hoursCaption && (
                  <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 2 }}>
                    {detail.hoursCaption}
                  </p>
                )}
                <div style={{ marginTop: 16, width: 375, height: 4, background: "var(--ku-progress-track)", borderRadius: 12 }}>
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, progress?.percent ?? detail.progress ?? 0))}%`,
                      height: "100%", background: "var(--ku-progress-fill)", borderRadius: 12,
                    }}
                  />
                </div>
                {progress && progress.total > 0 && (
                  <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", width: 375 }}>
                    <CompleteToggle
                      completed={progress.completed}
                      onToggle={progress.onToggle}
                      label={progress.completed ? "เรียนจบแล้ว" : "ทำเครื่องหมายว่าเรียนจบ"}
                      size={20}
                    />
                    <span style={{ fontFamily: FONT, fontSize: 12, lineHeight: "18px", color: "var(--ku-text-muted)" }}>
                      {`${progress.completedCount}/${progress.total} หัวข้อ · ${progress.percent ?? 0}%`}
                    </span>
                  </div>
                )}
              </motion.div>

              {detail.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, maxWidth: 569 }}>
                  {detail.tags.map((tag, i) => (
                    <motion.div
                      key={`${tag.label}-${i}`}
                      {...fadeIn(0.1 + i * 0.055)}
                      style={{
                        height: 30,
                        ...(tag.width ? { width: tag.width } : { minWidth: 98, padding: "0 14px" }),
                        background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)",
                        borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text)", whiteSpace: "nowrap" }}>
                        {tag.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <motion.div
                  {...fadeIn(0.14)}
                  style={{
                    minWidth: 121, height: 30, padding: "0 12px",
                    background: PRIMARY, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "var(--ku-badge-shadow)", flexShrink: 0,
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{detail.sectionLabel}</span>
                </motion.div>
                <motion.p
                  {...fadeIn(0.14)}
                  style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, lineHeight: "24px", color: "var(--ku-text)", maxWidth: 434 }}
                >
                  {detail.title}
                </motion.p>
              </div>

              {detail.summary && (
                <motion.p
                  {...fadeIn(0.18)}
                  style={{
                    fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)",
                    marginBottom: 20, maxWidth: 448,
                    // The gist is built as two lines: what the record is, then what it measured.
                    whiteSpace: "pre-line",
                  }}
                >
                  {detail.summary}
                </motion.p>
              )}

              {paragraphs.length > 0 && (
                <motion.div {...fadeIn(0.2)} style={{ maxWidth: 507, marginBottom: 32 }}>
                  {paragraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: FONT, fontSize: 14, lineHeight: "24px", color: "var(--ku-text)",
                        marginBottom: i === paragraphs.length - 1 ? 0 : 8,
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                  {detail.bodyFull && (
                    <button
                      type="button"
                      onClick={() => setShowFull((open) => !open)}
                      style={{
                        marginTop: 10, background: "transparent", border: "none", padding: 0,
                        cursor: "pointer", fontFamily: FONT, fontSize: 13, lineHeight: "21px",
                        color: "var(--ku-text-muted)", textDecoration: "underline",
                      }}
                    >
                      {showFull ? "ย่อบทคัดย่อ" : "ดูบทคัดย่อเต็ม"}
                    </button>
                  )}
                </motion.div>
              )}

              {detail.research && (
                <>
                  <motion.div {...fadeIn(0.24)} style={{ width: 562, height: 1, background: "var(--ku-divider-line)", opacity: 0.5, marginBottom: 22 }} />
                  <motion.div {...fadeIn(0.26)} style={{ maxWidth: 507, marginBottom: 40 }}>
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, lineHeight: "22px", color: "var(--ku-text)", marginBottom: 8 }}>
                      {detail.research.heading}
                    </p>
                    {detail.research.paragraphs.map((paragraph, i) => (
                      <p
                        key={i}
                        style={{
                          fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)",
                          marginBottom: i === detail.research!.paragraphs.length - 1 ? 0 : 8,
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </motion.div>
                </>
              )}

              {(detail.expert || detail.sourceUrl) && (
                <>
                  <motion.div {...fadeIn(0.3)} style={{ width: 562, height: 1, background: "var(--ku-divider-line)", opacity: 0.5, marginBottom: 22 }} />
                  <motion.div {...fadeIn(0.32)} style={{ maxWidth: 477, marginBottom: 48 }}>
                    {detail.expert && (
                      <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: "24px", color: "var(--ku-text)" }}>
                        <span style={{ fontWeight: 600 }}>{detail.expert.heading}</span>
                        <span style={{ fontWeight: 400, color: "var(--ku-text-muted)" }}>{detail.expert.value}</span>
                      </p>
                    )}
                    {detail.sourceUrl && (
                      <a
                        href={detail.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        title={detail.sourceUrl}
                        style={{
                          display: "inline-block", marginTop: detail.expert ? 8 : 0,
                          fontFamily: FONT, fontSize: 13, lineHeight: "21px",
                          color: "var(--ku-text-muted)", textDecoration: "underline",
                        }}
                      >
                        เปิดแหล่งข้อมูลต้นฉบับ
                      </a>
                    )}
                  </motion.div>
                </>
              )}

              {detail.mapNodes.length > 1 && (
                <motion.div {...fadeIn(0.36)}>
                  <MindMap title={detail.mapTitle} nodes={detail.mapNodes} edges={detail.mapEdges} />
                </motion.div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
