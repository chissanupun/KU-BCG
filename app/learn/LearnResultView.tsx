"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { GraphRagResult } from "@/lib/types";
import type { Roadmap } from "@/lib/roadmap";
import KnowledgeGraphView from "./KnowledgeGraphView";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const SOURCE_LABELS: Record<string, string> = {
  KUKR: "KUKR — คลังงานวิจัย",
  KU_Forest: "KU Forest — ทะเบียนงานวิจัย",
  KU_MOOC: "KU MOOC — คอร์สออนไลน์",
  UNKNOWN: "แหล่งอื่น ๆ",
};

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

function ResultRow({
  title,
  meta,
  description,
  href,
  delay,
}: {
  title: string;
  meta?: string;
  description?: string;
  href?: string;
  delay: number;
}) {
  const body = (
    <motion.div
      {...fadeIn(delay)}
      className="flex gap-6 items-start"
      style={{
        padding: "20px 0",
        borderBottom: "0.5px solid var(--ku-divider)",
      }}
    >
      <div className="flex-1 min-w-0">
        <p
          style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: "24px",
            color: "var(--ku-text)",
          }}
        >
          {title}
        </p>
        {meta && (
          <p
            style={{
              fontFamily: FONT,
              fontSize: 12,
              lineHeight: "18px",
              color: "var(--ku-text-faint)",
              marginTop: 6,
            }}
          >
            {meta}
          </p>
        )}
        {description && (
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              lineHeight: "20px",
              color: "var(--ku-text-muted)",
              marginTop: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </p>
        )}
        {href && (
          <span
            style={{
              display: "inline-block",
              marginTop: 12,
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              color: PRIMARY,
            }}
          >
            เปิดดู →
          </span>
        )}
      </div>
    </motion.div>
  );

  if (!href) return body;
  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      {body}
    </Link>
  );
}

export default function LearnResultView({
  query,
  result,
  roadmap,
}: {
  query: string;
  result: GraphRagResult;
  roadmap: Roadmap;
}) {
  const graph = result.knowledge_graph;
  const hasGraph =
    Boolean(graph?.center?.label) ||
    (graph?.nodes?.length ?? 0) > 0 ||
    (graph?.edges?.length ?? 0) > 0;

  const evidence = result.evidence ?? [];
  const roadmapCards = roadmap.phases.flatMap((phase, pi) =>
    phase.cards.map((card, ci) => ({
      ...card,
      phaseTitle: phase.title,
      key: `${pi}-${ci}`,
    })),
  );

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 32px 64px" }}>
      <motion.div {...fadeIn(0)}>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: "var(--ku-text-faint)",
            marginBottom: 8,
          }}
        >
          ผลการค้นหา
        </p>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 600,
            lineHeight: "36px",
            color: "var(--ku-text)",
            marginBottom: 8,
          }}
        >
          {query || result.title}
        </h1>
        {roadmap.estimatedHours && (
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: "var(--ku-text-muted)",
              marginBottom: 20,
            }}
          >
            {roadmap.estimatedHours}
            {roadmap.description ? ` · ${roadmap.description}` : ""}
          </p>
        )}
      </motion.div>

      {/* Graph hero — MAIN */}
      <motion.div
        {...fadeIn(0.06)}
        style={{
          background: "var(--ku-card-bg)",
          border: "0.5px solid var(--ku-card-border)",
          borderRadius: 12,
          padding: "16px 12px 8px",
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ku-text)",
            paddingLeft: 8,
            marginBottom: 8,
          }}
        >
          แผนผังความรู้
        </p>
        {hasGraph ? (
          <KnowledgeGraphView graph={graph} width={840} height={420} />
        ) : (
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              color: "var(--ku-text-muted)",
              padding: "48px 16px",
              textAlign: "center",
            }}
          >
            ยังไม่มีแผนผังสำหรับหัวข้อนี้
          </p>
        )}
      </motion.div>

      {/* Overview strip */}
      {result.overview?.intro && (
        <motion.div
          {...fadeIn(0.1)}
          style={{
            background: "var(--ku-overview-bg)",
            border: "0.5px solid var(--ku-overview-border)",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 32,
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ku-text-faint)",
              marginBottom: 6,
            }}
          >
            ภาพรวม
          </p>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              lineHeight: "22px",
              color: "var(--ku-text)",
            }}
          >
            {result.overview.intro}
          </p>
        </motion.div>
      )}

      {/* Evidence list */}
      {evidence.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 600,
              color: "var(--ku-text)",
              marginBottom: 4,
            }}
          >
            เอกสารที่เกี่ยวข้อง
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: "var(--ku-text-faint)",
              marginBottom: 8,
            }}
          >
            แสดง {evidence.length} รายการ
          </p>
          {evidence.map((item, i) => (
            <ResultRow
              key={`${item.url}-${i}`}
              title={item.title}
              meta={SOURCE_LABELS[item.source] ?? item.source}
              description={item.snippet}
              href={item.url || undefined}
              delay={0.12 + i * 0.04}
            />
          ))}
        </section>
      )}

      {/* Learning path rows */}
      {roadmapCards.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 600,
              color: "var(--ku-text)",
              marginBottom: 4,
            }}
          >
            เส้นทางการเรียนรู้
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: "var(--ku-text-faint)",
              marginBottom: 8,
            }}
          >
            แสดง {roadmapCards.length} โมดูล
          </p>
          {roadmapCards.map((card, i) => (
            <ResultRow
              key={card.key}
              title={card.title}
              meta={[card.phaseTitle, card.hours].filter(Boolean).join(" · ")}
              description={card.description}
              href={card.href}
              delay={0.14 + i * 0.04}
            />
          ))}
        </section>
      )}
    </div>
  );
}
