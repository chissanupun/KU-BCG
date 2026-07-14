"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch, ApiError, googleLoginUrl } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { GraphRagResult, SearchHistory } from "@/lib/types";
import KnowledgeGraphView from "./KnowledgeGraphView";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const SOURCE_LABELS: Record<string, string> = {
  KUKR: "KUKR — คลังงานวิจัย",
  KU_Forest: "KU Forest — ทะเบียนงานวิจัย",
  KU_MOOC: "KU MOOC — คอร์สออนไลน์",
  UNKNOWN: "แหล่งอื่น ๆ",
};

const TIER_COLOR: Record<string, string> = {
  basic: "#16a34a",
  intermediate: "#2563eb",
  advanced: "#9333ea",
};

const TABS = [
  { key: "overview", label: "ภาพรวม" },
  { key: "graph", label: "แผนผังความรู้" },
  { key: "learning", label: "เส้นทางเรียนรู้" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

export default function SearchResults({ query }: { query: string }) {
  const { user, loading: userLoading } = useUser();
  const [result, setResult] = useState<GraphRagResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      setError({ status: 401, message: "กรุณาเข้าสู่ระบบก่อนค้นหา" });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setTab("overview");

    apiFetch<{ data: SearchHistory }>("/api/search", { method: "POST", body: { query } })
      .then((json) => {
        if (cancelled) return;
        if (json.data.result) setResult(json.data.result);
        else setError({ message: "ไม่พบผลลัพธ์" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
          setError({ status: err.status, message: "ฟีเจอร์นี้ backend ยังไม่เปิดใช้งาน (รอทีม backend implement /api/search)" });
        } else if (err instanceof ApiError && err.status === 401) {
          setError({ status: 401, message: "กรุณาเข้าสู่ระบบก่อนค้นหา" });
        } else if (err instanceof ApiError) {
          setError({ status: err.status, message: err.message || "เกิดข้อผิดพลาดในการค้นหา" });
        } else {
          setError({ message: "เกิดข้อผิดพลาดในการค้นหา" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, user, userLoading]);

  const geminiActive = (result?._meta?.calls ?? 0) > 0;

  return (
    <div style={{ width: 928, margin: "0 auto", paddingTop: 40, paddingBottom: 80 }}>
      <motion.h1 {...fadeIn(0)} style={{ fontFamily: FONT, fontSize: 22, fontWeight: 600, color: "var(--ku-text)" }}>
        {result?.title ? result.title : `ผลการค้นหา: “${query}”`}
      </motion.h1>

      {(loading || userLoading) && (
        <p style={{ fontFamily: FONT, fontSize: 14, color: "var(--ku-text-muted)", marginTop: 16 }}>กำลังค้นหา...</p>
      )}

      {error && !loading && !userLoading && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontFamily: FONT, fontSize: 14, color: "#dc2626" }}>{error.message}</p>
          {error.status === 401 && (
            <button
              onClick={() => {
                window.location.href = googleLoginUrl();
              }}
              className="hover:opacity-90 active:scale-[0.98] transition-all"
              style={{
                marginTop: 12,
                background: PRIMARY,
                color: "white",
                fontFamily: FONT,
                fontSize: 14,
                borderRadius: 8,
                padding: "10px 20px",
              }}
            >
              เข้าสู่ระบบด้วย Google
            </button>
          )}
        </div>
      )}

      {!loading && !userLoading && !error && result && (
        <>
          {/* Badges */}
          <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 12 }}>
            {result.tier && (
              <span
                style={{
                  fontFamily: FONT, fontSize: 12, fontWeight: 600, color: "white",
                  background: TIER_COLOR[result.tier] ?? "#6b7280", borderRadius: 6, padding: "3px 10px",
                }}
              >
                {result.tier}
              </span>
            )}
            <span
              style={{
                fontFamily: FONT, fontSize: 12, color: "var(--ku-text-muted)",
                background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)", borderRadius: 6, padding: "3px 10px",
              }}
            >
              {geminiActive ? "AI synthesis" : "heuristic fallback"}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex" style={{ gap: 4, marginTop: 20, borderBottom: "0.5px solid var(--ku-card-border)" }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  fontFamily: FONT, fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                  color: tab === t.key ? PRIMARY : "var(--ku-text-muted)",
                  padding: "10px 16px",
                  borderBottom: tab === t.key ? `2px solid ${PRIMARY}` : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div style={{ marginTop: 24 }}>
              <motion.div
                {...fadeIn(0.03)}
                style={{
                  background: "var(--ku-overview-bg)", border: "0.5px solid var(--ku-overview-border)",
                  borderRadius: 10, padding: "16px 20px",
                }}
              >
                {result.overview.intro && (
                  <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: "22px", color: "var(--ku-text)" }}>{result.overview.intro}</p>
                )}
                {result.overview.analogy && (
                  <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 10 }}>
                    {result.overview.analogy}
                  </p>
                )}
                {result.overview.research_basis && (
                  <p style={{ fontFamily: FONT, fontSize: 12, lineHeight: "18px", color: "var(--ku-text-faint)", marginTop: 10 }}>
                    {result.overview.research_basis}
                  </p>
                )}
                {result.overview.expert && (
                  <p style={{ fontFamily: FONT, fontSize: 12, lineHeight: "18px", color: "var(--ku-text-faint)", marginTop: 4 }}>
                    {result.overview.expert}
                  </p>
                )}
              </motion.div>

              {result.evidence.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <motion.h2 {...fadeIn(0.05)} style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: PRIMARY, marginBottom: 12 }}>
                    หลักฐานอ้างอิง ({result.evidence.length})
                  </motion.h2>
                  <div className="flex flex-col" style={{ gap: 12 }}>
                    {result.evidence.map((item, i) => (
                      <motion.a
                        key={`${item.url}-${i}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        {...fadeIn(0.07 + i * 0.02)}
                        className="block"
                        style={{
                          background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)",
                          borderRadius: 10, padding: "16px 20px", textDecoration: "none",
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
                        <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "var(--ku-text)" }}>{item.title}</p>
                        {item.snippet && (
                          <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 6 }}>
                            {item.snippet}
                          </p>
                        )}
                        <span
                          style={{
                            display: "inline-block", marginTop: 10, fontFamily: FONT, fontSize: 12, color: "var(--ku-text)",
                            background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)", borderRadius: 6, padding: "2px 8px",
                          }}
                        >
                          {SOURCE_LABELS[item.source] ?? item.source}
                        </span>
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Graph tab */}
          {tab === "graph" && (
            <div style={{ marginTop: 24 }}>
              {result.knowledge_graph.description && (
                <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)", marginBottom: 12 }}>
                  {result.knowledge_graph.description}
                </p>
              )}
              <KnowledgeGraphView graph={result.knowledge_graph} />
            </div>
          )}

          {/* Learning tab */}
          {tab === "learning" && (
            <div style={{ marginTop: 24 }}>
              <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)" }}>
                ประมาณ {result.learning_path.estimated_hours} ชั่วโมง
                {result.learning_path.subtitle ? ` · ${result.learning_path.subtitle}` : ""}
              </p>

              <div className="flex flex-col" style={{ gap: 20, marginTop: 20 }}>
                {result.learning_path.phases.map((phase, pi) => (
                  <motion.div key={phase.name} {...fadeIn(0.05 + pi * 0.05)}>
                    <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: PRIMARY }}>{phase.name}</p>
                    {phase.intro && (
                      <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 4 }}>
                        {phase.intro}
                      </p>
                    )}
                    <div className="flex flex-col" style={{ gap: 10, marginTop: 12 }}>
                      {phase.modules.map((mod, mi) => (
                        <div
                          key={`${mod.title}-${mi}`}
                          style={{
                            background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)",
                            borderRadius: 10, padding: "14px 18px",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: "var(--ku-text)" }}>{mod.title}</p>
                            <span style={{ fontFamily: FONT, fontSize: 12, color: "var(--ku-text-faint)" }}>{mod.hours}</span>
                          </div>
                          {mod.desc && (
                            <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 6, wordBreak: "break-word" }}>
                              {mod.desc}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
