"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch, ApiError, googleLoginUrl } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { SmartPick, SmartPicks } from "@/lib/types";
import AppShell from "../components/AppShell";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

function PickCard({ pick, index, isTop, onOpen }: { pick: SmartPick; index: number; isTop: boolean; onOpen: () => void }) {
  return (
    <motion.div {...fadeIn(0.22 + index * 0.07)} style={{ position: "relative", marginBottom: 16 }}>
      {isTop && (
        <div style={{
          position: "absolute", top: -13, left: 22, zIndex: 1,
          background: PRIMARY, color: "#fff",
          fontSize: 13, fontWeight: 700,
          paddingLeft: 14, paddingRight: 14,
          height: 26, borderRadius: 6,
          display: "flex", alignItems: "center",
          fontFamily: FONT,
        }}>
          ตรงที่สุด {pick.match}%
        </div>
      )}
      <motion.div
        whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
        style={{
          width: "100%",
          background: "var(--ku-card-bg)",
          border: isTop ? `2px solid ${PRIMARY}` : "1px solid var(--ku-card-border)",
          borderRadius: 5,
          padding: "18px 22px 16px",
          paddingTop: isTop ? 24 : 18,
          display: "flex",
          flexDirection: "column" as const,
          gap: 10,
        }}
      >
        {/* Title + button row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ku-text)", lineHeight: "22px", fontFamily: FONT }}>
            {pick.title}
          </p>
          <button
            onClick={onOpen}
            style={{
              flexShrink: 0,
              height: 26, paddingLeft: 16, paddingRight: 16, borderRadius: 6,
              fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" as const,
              ...(isTop
                ? { background: PRIMARY, border: "none", color: "#fff" }
                : { background: "transparent", border: "1px solid #737373", color: "#737373" }),
            }}
          >
            ดูเพิ่มเติม
          </button>
        </div>

        {/* Document facts */}
        <p style={{ fontSize: 15, color: "var(--ku-text-muted)", fontFamily: FONT, lineHeight: "22px" }}>
          {pick.info}
          {!isTop && pick.match > 0 && ` · ตรงกับคุณ ${pick.match}%`}
        </p>

        {/* Why this was picked — the signals that actually fired */}
        {pick.reasons.map((reason, i) => (
          <p key={i} style={{ fontSize: 13, color: "var(--ku-text-muted)", fontFamily: FONT, lineHeight: "20px" }}>
            {reason}
          </p>
        ))}

        {/* Source tag */}
        <div style={{ display: "inline-flex" }}>
          <span style={{
            fontSize: 13, color: PRIMARY, fontFamily: FONT,
            background: "rgba(23,201,100,0.15)",
            borderRadius: 6, paddingLeft: 10, paddingRight: 10, height: 22,
            display: "inline-flex", alignItems: "center",
          }}>
            {pick.source}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SmartPicksPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [picks, setPicks] = useState<SmartPicks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setLoading(false);
      setError({ status: 401, message: "กรุณาเข้าสู่ระบบเพื่อดูคำแนะนำ" });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<{ smart_picks: SmartPicks }>("/api/smart-picks")
      .then((json) => {
        if (!cancelled) setPicks(json.smart_picks);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setError({ status: 403, message: "กรุณากรอกข้อมูลโปรไฟล์ให้ครบก่อน" });
        } else if (err instanceof ApiError && err.status === 401) {
          setError({ status: 401, message: "กรุณาเข้าสู่ระบบเพื่อดูคำแนะนำ" });
        } else {
          setError({ message: "ไม่สามารถโหลดคำแนะนำได้" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, userLoading]);

  const items = picks?.items ?? [];

  return (
    <AppShell activeNav="recommend" logo={false}>
      <div className="flex flex-col items-center pt-6! min-[1025px]:pt-11!" style={{ paddingBottom: 60, fontFamily: FONT }}>

        <div style={{ width: "100%", maxWidth: 600, padding: "0 16px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          <motion.div
            {...fadeIn(0)}
            style={{
              background: PRIMARY, color: "#fff",
              fontSize: 15, fontWeight: 600,
              paddingLeft: 14, paddingRight: 14, height: 29, borderRadius: 6,
              display: "flex", alignItems: "center", fontFamily: FONT,
            }}
          >
            แนะนำอัจฉริยะ
          </motion.div>
          <motion.h1
            {...fadeIn(0.04)}
            style={{ fontSize: 16, fontWeight: 700, color: "var(--ku-text)", fontFamily: FONT }}
          >
            คำแนะนำจาก AI สำหรับคุณ
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          {...fadeIn(0.08)}
          style={{ fontSize: 15, color: "var(--ku-text)", lineHeight: "24px", marginBottom: 32, fontFamily: FONT }}
        >
          สำรวจคอร์สที่คัดสรรมาเพื่อเส้นทางการเรียนรู้ของคุณโดยเฉพาะ
        </motion.p>

        {/* Info box — carries the actual derivation, not a fixed sentence */}
        <motion.div
          {...fadeIn(0.12)}
          style={{
            borderRadius: 5,
            background: "rgba(23,201,100,0.2)",
            padding: "16px 20px",
            marginBottom: 32,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
            ทำไมถึงแนะนำสิ่งเหล่านี้?{" "}
            <span style={{ fontWeight: 400 }}>
              {picks?.reason ?? "คำแนะนำขึ้นอยู่กับประวัติการเรียนและทักษะของคุณ"}
            </span>
          </p>
        </motion.div>

        {/* top picks label */}
        <motion.p
          {...fadeIn(0.16)}
          style={{ fontSize: 15, fontWeight: 700, color: "var(--ku-text)", marginBottom: 18, fontFamily: FONT }}
        >
          คำแนะนำอันดับต้น
        </motion.p>

        {loading || userLoading ? (
          <p style={{ fontSize: 15, color: "var(--ku-text-muted)", fontFamily: FONT }}>กำลังวิเคราะห์ความสนใจของคุณ...</p>
        ) : error ? (
          <div>
            <p style={{ fontSize: 15, color: "#dc2626", fontFamily: FONT }}>{error.message}</p>
            {error.status === 401 && (
              <button
                onClick={() => {
                  window.location.href = googleLoginUrl();
                }}
                className="hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ marginTop: 12, background: PRIMARY, color: "white", fontSize: 14, borderRadius: 8, padding: "10px 20px", fontFamily: FONT }}
              >
                เข้าสู่ระบบด้วย Google
              </button>
            )}
            {error.status === 403 && (
              <button
                onClick={() => router.push("/register")}
                className="hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ marginTop: 12, background: PRIMARY, color: "white", fontSize: 14, borderRadius: 8, padding: "10px 20px", fontFamily: FONT }}
              >
                ไปกรอกโปรไฟล์
              </button>
            )}
          </div>
        ) : items.length === 0 ? (
          <p style={{ fontSize: 15, color: "var(--ku-text-muted)", fontFamily: FONT }}>
            ยังไม่มีคำแนะนำ — ลองค้นหาหัวข้อที่สนใจสักครั้งแล้วกลับมาดูใหม่
          </p>
        ) : (
          items.map((pick, i) => (
            <PickCard
              key={`${pick.url || pick.title}-${i}`}
              pick={pick}
              index={i}
              isTop={i === 0}
              onOpen={() => router.push(`/learn?q=${encodeURIComponent(pick.query)}`)}
            />
          ))
        )}
        </div>
      </div>
    </AppShell>
  );
}
