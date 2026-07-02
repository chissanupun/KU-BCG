"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

type DocResult = {
  id: string;
  score: number;
  title?: string;
  title_en?: string;
  abstract?: string;
  authors?: string[];
  year?: string | number;
  url?: string;
  topic_names_th?: string[];
  topic_names_en?: string[];
  bcg_pillars?: string[];
  keywords?: string[];
  doc_type?: string;
};

type Relation = {
  subject: string;
  predicate: string;
  object: string;
  topic_id: string;
};

type SearchResponse = {
  total: number;
  by_source: Record<string, DocResult[]>;
  relations: Relation[];
  summary?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  KUKR: "KUKR — คลังงานวิจัย",
  KU_Forest: "KU Forest — ทะเบียนงานวิจัย",
  KU_MOOC: "KU MOOC — คอร์สออนไลน์",
};

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

export default function SearchResults({ query }: { query: string }) {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        return res.json();
      })
      .then((json: SearchResponse) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "เกิดข้อผิดพลาดในการค้นหา");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div style={{ width: 928, margin: "0 auto", paddingTop: 40, paddingBottom: 80 }}>
      <motion.h1
        {...fadeIn(0)}
        style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: "var(--ku-text)" }}
      >
        ผลการค้นหา: &ldquo;{query}&rdquo;
      </motion.h1>

      {loading && (
        <p style={{ fontFamily: FONT, fontSize: 14, color: "var(--ku-text-muted)", marginTop: 16 }}>
          กำลังค้นหา...
        </p>
      )}

      {error && (
        <p style={{ fontFamily: FONT, fontSize: 14, color: "#dc2626", marginTop: 16 }}>{error}</p>
      )}

      {!loading && !error && data && (
        <>
          <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)", marginTop: 8 }}>
            พบ {data.total} รายการ
          </p>

          {data.summary && (
            <motion.div
              {...fadeIn(0.03)}
              style={{
                marginTop: 20,
                background: "var(--ku-overview-bg)",
                border: "0.5px solid var(--ku-overview-border)",
                borderRadius: 10,
                padding: "16px 20px",
              }}
            >
              <p style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: PRIMARY, marginBottom: 6 }}>
                สรุปโดย AI
              </p>
              <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: "22px", color: "var(--ku-text)" }}>
                {data.summary}
              </p>
            </motion.div>
          )}

          {data.total === 0 && (
            <p style={{ fontFamily: FONT, fontSize: 14, color: "var(--ku-text-muted)", marginTop: 32 }}>
              ไม่พบผลลัพธ์ที่ตรงกับคำค้นหานี้
            </p>
          )}

          {Object.entries(data.by_source).map(([source, docs], si) => (
            <div key={source} style={{ marginTop: 32 }}>
              <motion.h2
                {...fadeIn(0.05 + si * 0.05)}
                style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}
              >
                {SOURCE_LABELS[source] ?? source} ({docs.length})
              </motion.h2>

              <div className="flex flex-col" style={{ gap: 12 }}>
                {docs.map((doc, di) => (
                  <motion.a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    {...fadeIn(0.08 + si * 0.05 + di * 0.02)}
                    className="block"
                    style={{
                      background: "var(--ku-card-bg)",
                      border: "0.5px solid var(--ku-card-border)",
                      borderRadius: 10,
                      padding: "16px 20px",
                      textDecoration: "none",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(59,99,71,0.6)";
                      el.style.boxShadow = "0 0 20px rgba(59,99,71,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--ku-card-border)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "var(--ku-text)" }}>
                      {doc.title}
                    </p>
                    {doc.abstract && (
                      <p
                        style={{
                          fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)",
                          marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}
                      >
                        {doc.abstract}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center" style={{ gap: 8, marginTop: 10 }}>
                      {doc.year && (
                        <span style={{ fontFamily: FONT, fontSize: 12, color: "var(--ku-text-faint)" }}>{doc.year}</span>
                      )}
                      {doc.topic_names_th?.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontFamily: FONT, fontSize: 12, color: "var(--ku-text)",
                            background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)",
                            borderRadius: 6, padding: "2px 8px",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.a>
                ))}
              </div>
            </div>
          ))}

          {data.relations.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <motion.h2
                {...fadeIn(0.1)}
                style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}
              >
                ความสัมพันธ์เชิงความหมาย ({data.relations.length})
              </motion.h2>
              <div className="flex flex-wrap" style={{ gap: 8 }}>
                {data.relations.map((rel, ri) => (
                  <span
                    key={ri}
                    style={{
                      fontFamily: FONT, fontSize: 12, color: "var(--ku-text-muted)",
                      background: "var(--ku-surface)", borderRadius: 6, padding: "4px 10px",
                    }}
                  >
                    {rel.subject} → {rel.predicate} → {rel.object}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
