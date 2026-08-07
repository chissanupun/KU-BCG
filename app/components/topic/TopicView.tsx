"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { TopicDetail } from "@/lib/topic";
import AppShell from "../AppShell";
import { PRIMARY, FONT, fadeIn } from "../roadmap/tokens";
import MindMap from "./MindMap";

/**
 * Topic detail inside AppShell. Curated default and GraphRAG cards share this.
 * Empty blocks omit rather than render blank.
 */
export default function TopicView({ detail, notice }: { detail?: TopicDetail | null; notice?: ReactNode }) {
  const breadcrumb = detail?.badge
    ? `หน้าแรก > หัวข้อ > ${detail.badge}`
    : "หน้าแรก > หัวข้อ";

  return (
    <AppShell activeNav="search" breadcrumb={breadcrumb}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 28px 64px", fontFamily: FONT }}>
        {notice ? (
          <div style={{ fontFamily: FONT, fontSize: 14, lineHeight: "22px" }}>{notice}</div>
        ) : detail ? (
          <>
            {detail.badge && (
              <motion.div
                {...fadeIn(0)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 32,
                  padding: "0 14px",
                  marginBottom: 16,
                  background: "var(--ku-tag-bg)",
                  border: "0.5px solid var(--ku-tag-border)",
                  borderRadius: 8,
                }}
              >
                <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: "var(--ku-text)" }}>
                  {detail.badge}
                </p>
              </motion.div>
            )}

            <motion.div
              {...fadeIn(0.06)}
              style={{
                background: "var(--ku-overview-bg)",
                border: "0.5px solid var(--ku-overview-border)",
                borderRadius: 10,
                padding: "20px 22px 16px",
                marginBottom: 20,
              }}
            >
              {detail.estimatedHours && (
                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "var(--ku-text-muted)" }}>
                  {detail.estimatedHours}
                </p>
              )}
              {detail.hoursCaption && (
                <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)", marginTop: 2 }}>
                  {detail.hoursCaption}
                </p>
              )}
              {(detail.progress ?? 0) > 0 && (
                <div style={{ marginTop: 16, width: "100%", maxWidth: 375, height: 4, background: "var(--ku-progress-track)", borderRadius: 12 }}>
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, detail.progress ?? 0))}%`,
                      height: "100%",
                      background: "var(--ku-progress-fill)",
                      borderRadius: 12,
                    }}
                  />
                </div>
              )}
            </motion.div>

            {detail.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                {detail.tags.map((tag, i) => (
                  <motion.div
                    key={`${tag.label}-${i}`}
                    {...fadeIn(0.1 + i * 0.04)}
                    style={{
                      height: 30,
                      padding: "0 14px",
                      background: "var(--ku-tag-bg)",
                      border: "0.5px solid var(--ku-tag-border)",
                      borderRadius: 6,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text)", whiteSpace: "nowrap" }}>
                      {tag.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
              <motion.div
                {...fadeIn(0.14)}
                style={{
                  minWidth: 100,
                  height: 30,
                  padding: "0 12px",
                  background: PRIMARY,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--ku-badge-shadow)",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                  {detail.sectionLabel}
                </span>
              </motion.div>
              <motion.p
                {...fadeIn(0.14)}
                style={{ fontFamily: FONT, fontSize: 18, fontWeight: 600, lineHeight: "26px", color: "var(--ku-text)" }}
              >
                {detail.title}
              </motion.p>
            </div>

            {detail.summary && (
              <motion.p
                {...fadeIn(0.18)}
                style={{ fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)", marginBottom: 20 }}
              >
                {detail.summary}
              </motion.p>
            )}

            {detail.body.length > 0 && (
              <motion.div {...fadeIn(0.2)} style={{ marginBottom: 32 }}>
                {detail.body.map((paragraph, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: FONT,
                      fontSize: 14,
                      lineHeight: "24px",
                      color: "var(--ku-text)",
                      marginBottom: i === detail.body.length - 1 ? 0 : 8,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </motion.div>
            )}

            {detail.research && (
              <>
                <motion.div {...fadeIn(0.24)} style={{ height: 1, background: "var(--ku-divider-line)", opacity: 0.5, marginBottom: 22 }} />
                <motion.div {...fadeIn(0.26)} style={{ marginBottom: 40 }}>
                  <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "var(--ku-text)", marginBottom: 8 }}>
                    {detail.research.heading}
                  </p>
                  {detail.research.paragraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      style={{
                        fontFamily: FONT,
                        fontSize: 13,
                        lineHeight: "21px",
                        color: "var(--ku-text-muted)",
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
                <motion.div {...fadeIn(0.3)} style={{ height: 1, background: "var(--ku-divider-line)", opacity: 0.5, marginBottom: 22 }} />
                <motion.div {...fadeIn(0.32)} style={{ marginBottom: 48 }}>
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
                        display: "inline-block",
                        marginTop: detail.expert ? 8 : 0,
                        fontFamily: FONT,
                        fontSize: 13,
                        color: "var(--ku-text-muted)",
                        textDecoration: "underline",
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
    </AppShell>
  );
}
