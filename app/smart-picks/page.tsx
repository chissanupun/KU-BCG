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
    <motion.div {...fadeIn(0.16 + index * 0.06)} style={{ position: "relative", marginBottom: 16 }}>
      {isTop && (
        <div
          style={{
            position: "absolute",
            top: -11,
            left: 18,
            zIndex: 1,
            background: PRIMARY,
            color: "#fff",
            fontSize: 12,
            fontWeight: 700,
            paddingLeft: 12,
            paddingRight: 12,
            height: 24,
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            fontFamily: FONT,
          }}
        >
          ตรงที่สุด {pick.match}%
        </div>
      )}
      <div
        style={{
          width: "100%",
          background: "var(--ku-card-bg)",
          border: isTop ? `1.5px solid ${PRIMARY}` : "0.5px solid var(--ku-card-border)",
          borderRadius: 10,
          padding: "18px 22px 16px",
          paddingTop: isTop ? 24 : 18,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--ku-text)", lineHeight: "22px", fontFamily: FONT }}>
            {pick.title}
          </p>
          <button
            onClick={onOpen}
            style={{
              flexShrink: 0,
              height: 28,
              paddingLeft: 14,
              paddingRight: 14,
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
              whiteSpace: "nowrap",
              ...(isTop
                ? { background: PRIMARY, border: "none", color: "#fff" }
                : { background: "transparent", border: "1px solid var(--ku-card-border)", color: "var(--ku-text-muted)" }),
            }}
          >
            ดูเพิ่มเติม
          </button>
        </div>

        <p style={{ fontSize: 14, color: "var(--ku-text-muted)", fontFamily: FONT, lineHeight: "22px" }}>
          {pick.info}
          {!isTop && pick.match > 0 && ` · ตรงกับคุณ ${pick.match}%`}
        </p>

        {pick.reasons.map((reason, i) => (
          <p key={i} style={{ fontSize: 13, color: "var(--ku-text-muted)", fontFamily: FONT, lineHeight: "20px" }}>
            {reason}
          </p>
        ))}

        <div style={{ display: "inline-flex" }}>
          <span
            style={{
              fontSize: 12,
              color: PRIMARY,
              fontFamily: FONT,
              background: "rgba(59,99,71,0.12)",
              borderRadius: 6,
              paddingLeft: 10,
              paddingRight: 10,
              height: 22,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {pick.source}
          </span>
        </div>
      </div>
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
    <AppShell activeNav="recommend" breadcrumb="หน้าแรก > แนะนำอัจฉริยะ">
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 28px 64px", fontFamily: FONT }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <motion.div
            {...fadeIn(0)}
            style={{
              background: PRIMARY,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              paddingLeft: 12,
              paddingRight: 12,
              height: 28,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              fontFamily: FONT,
            }}
          >
            Smart Picks
          </motion.div>
          <motion.h1
            {...fadeIn(0.04)}
            style={{ fontSize: 18, fontWeight: 700, color: "var(--ku-text)", fontFamily: FONT }}
          >
            คำแนะนำจาก AI สำหรับคุณ
          </motion.h1>
        </div>

        <motion.p
          {...fadeIn(0.08)}
          style={{ fontSize: 14, color: "var(--ku-text-muted)", lineHeight: "22px", marginBottom: 24, fontFamily: FONT }}
        >
          สำรวจคอร์สที่คัดสรรมาเพื่อเส้นทางการเรียนรู้ของคุณโดยเฉพาะ
        </motion.p>

        <motion.div
          {...fadeIn(0.1)}
          style={{
            borderRadius: 10,
            background: "rgba(59,99,71,0.1)",
            padding: "14px 18px",
            marginBottom: 28,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 700, color: PRIMARY, fontFamily: FONT }}>
            ทำไมถึงแนะนำสิ่งเหล่านี้?{" "}
            <span style={{ fontWeight: 400, color: "var(--ku-text)" }}>
              {picks?.reason ?? "คำแนะนำขึ้นอยู่กับประวัติการเรียนและทักษะของคุณ"}
            </span>
          </p>
        </motion.div>

        <motion.p
          {...fadeIn(0.12)}
          style={{ fontSize: 14, fontWeight: 700, color: "var(--ku-text)", marginBottom: 16, fontFamily: FONT }}
        >
          TOP PICKS
        </motion.p>

        {loading || userLoading ? (
          <p style={{ fontSize: 14, color: "var(--ku-text-muted)", fontFamily: FONT }}>กำลังวิเคราะห์ความสนใจของคุณ...</p>
        ) : error ? (
          <div>
            <p style={{ fontSize: 14, color: "#dc2626", fontFamily: FONT }}>{error.message}</p>
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
          <p style={{ fontSize: 14, color: "var(--ku-text-muted)", fontFamily: FONT }}>
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
    </AppShell>
  );
}
