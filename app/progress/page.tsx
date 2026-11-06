"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { apiFetch, googleLoginUrl } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { ProgressList, ProgressRow } from "@/lib/types";
import AppShell from "../components/AppShell";
import ProgressBar from "../components/roadmap/ProgressBar";
import { FONT, PRIMARY, fadeIn } from "../components/roadmap/tokens";

function ProgressRow({ item, index }: { item: ProgressRow; index: number }) {
  return (
    <motion.li {...fadeIn(0.1 + index * 0.03)} style={{ listStyle: "none" }}>
      <Link
        href={`/learn?h=${item.id}`}
        className="block hover:bg-[var(--ku-hover-bg)] transition-colors"
        style={{
          background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)", borderRadius: 10,
          padding: "14px 18px", textDecoration: "none", overflowWrap: "anywhere",
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ku-text)" }}>{item.title || item.query}</p>
        <div style={{ marginTop: 10 }}>
          <ProgressBar progress={item.percent} width="100%" />
        </div>
        <p style={{ fontSize: 12, color: "var(--ku-text-muted)", marginTop: 8 }}>
          {`เรียนจบแล้ว ${item.completed_count}/${item.total} หัวข้อ · ${item.percent}%`}
        </p>
      </Link>
    </motion.li>
  );
}

export default function ProgressPage() {
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let live = true;
    apiFetch<ProgressList>("/api/progress")
      .then((json) => { if (live) setItems(json.data); })
      .catch(() => { if (live) setItems([]); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [user]);

  return (
    <AppShell activeNav="progress" logo={false}>
      <main className="flex flex-col items-center pt-6! min-[1025px]:pt-11!" style={{ paddingBottom: 60, fontFamily: FONT }}>
        <div style={{ width: 600, maxWidth: "100%", padding: "0 16px" }}>
          <motion.div {...fadeIn(0)} className="flex items-center" style={{ gap: 16, marginBottom: 10 }}>
            <span style={{ background: PRIMARY, color: "#fff", fontSize: 15, fontWeight: 600, padding: "0 14px", height: 29, borderRadius: 6, display: "flex", alignItems: "center" }}>
              ความก้าวหน้า
            </span>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--ku-text)" }}>เส้นทางการเรียนรู้ของคุณ</h1>
          </motion.div>
          <p style={{ fontSize: 15, lineHeight: "24px", color: "var(--ku-text)", marginBottom: 24 }}>
            ความคืบหน้าของเส้นทางการเรียนรู้ที่คุณเคยเปิด (ล่าสุดอยู่บนสุด)
          </p>

          {userLoading || (user && loading && items.length === 0) ? (
            <p style={{ fontSize: 14, color: "var(--ku-text-muted)" }}>กำลังโหลด...</p>
          ) : !user ? (
            <div>
              <p style={{ fontSize: 14, color: "var(--ku-text-muted)" }}>กรุณาเข้าสู่ระบบเพื่อดูความก้าวหน้า</p>
              <button
                onClick={() => { window.location.href = googleLoginUrl(); }}
                className="hover:opacity-90 active:scale-[0.98] transition-all"
                style={{ marginTop: 12, background: PRIMARY, color: "white", fontSize: 14, borderRadius: 8, padding: "10px 20px" }}
              >
                เข้าสู่ระบบด้วย Google
              </button>
            </div>
          ) : items.length === 0 ? (
            <p style={{ fontSize: 14, color: "var(--ku-text-muted)" }}>
              ยังไม่มีเส้นทางการเรียนรู้ — <Link href="/" style={{ color: "var(--ku-text)", textDecoration: "underline" }}>เริ่มค้นหาหัวข้อแรก</Link>
            </p>
          ) : (
            // Order is whatever /api/progress returned (newest first); not re-sorted here.
            <ul className="flex flex-col" style={{ gap: 12, padding: 0 }}>
              {items.map((item, i) => (
                <ProgressRow key={item.id} item={item} index={i} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppShell>
  );
}
