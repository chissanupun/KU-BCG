"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import AppShell from "./components/AppShell";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const SUGGESTIONS = [
  { display: "การวิเคราะห์คาร์บอนนาโนทิวบ์", query: "การวิเคราะห์คาร์บอนนาโนทิวบ์" },
  { display: "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024", query: "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024" },
  { display: "ผลการวิจัยสำคัญด้านโครงข่ายประสาท", query: "ผลการวิจัยสำคัญด้านโครงข่ายประสาท" },
  { display: "Carbon footprint", query: "Carbon footprint" },
  { display: "การจัดการขยะแปรรูปเป็นพลังงาน", query: "การจัดการขยะแปรรูปเป็นพลังงาน" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (value?: string) => {
    const q = (value ?? query).trim();
    if (!q) return;
    router.push(`/learn?q=${encodeURIComponent(q)}`);
  };

  return (
    <AppShell activeNav="search" breadcrumb="หน้าแรก > ค้นหา">
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: "100%", padding: "48px 24px 80px", fontFamily: FONT }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
            style={{ textAlign: "center", marginBottom: 28 }}
          >
            <h1
              style={{
                fontFamily: "var(--font-abhaya), serif",
                fontSize: 40,
                fontWeight: 400,
                lineHeight: "48px",
                color: "var(--ku-text)",
                marginBottom: 10,
              }}
            >
              ค้นหาหัวข้อ
            </h1>
            <p
              style={{
                fontSize: 15,
                lineHeight: "22px",
                color: "var(--ku-text-muted)",
              }}
            >
              เจาะลึกงานวิจัย KU BCG เพื่อดึงหัวข้อและเส้นทางเรียนรู้ที่เกี่ยวเนื่อง
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="flex items-center w-full overflow-hidden"
            style={{
              background: "var(--ku-search-bg)",
              boxShadow: "var(--ku-search-shadow)",
              borderRadius: 999,
              border: "0.5px solid var(--ku-card-border)",
              padding: "6px 6px 6px 20px",
              gap: 8,
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ค้นหาหัวข้อจากงานวิจัย..."
              className="search-input flex-1 outline-none bg-transparent text-[15px]"
              style={{ padding: "12px 8px", color: "var(--ku-text)" }}
            />
            <button
              onClick={() => handleSearch()}
              className="shrink-0 flex items-center justify-center rounded-full hover:opacity-90 active:scale-[0.98] transition-all"
              aria-label="เริ่มค้นหา"
              style={{
                width: 44,
                height: 44,
                background: PRIMARY,
                color: "#fff",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </button>
          </motion.div>

          <motion.p
            initial="hidden"
            animate="visible"
            custom={2}
            variants={fadeUp}
            style={{
              fontSize: 13,
              color: "var(--ku-text-faint)",
              marginTop: 28,
              marginBottom: 12,
            }}
          >
            ลองค้นหา:
          </motion.p>

          <div className="flex flex-col" style={{ gap: 10 }}>
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={s.query}
                onClick={() => handleSearch(s.query)}
                initial="hidden"
                animate="visible"
                custom={i + 3}
                variants={fadeUp}
                whileHover={{ x: 4, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.99 }}
                className="text-left flex items-center gap-3"
                style={{
                  background: "transparent",
                  border: "0.5px solid var(--ku-card-border)",
                  borderRadius: 999,
                  padding: "12px 18px",
                  cursor: "pointer",
                  color: "var(--ku-text)",
                  fontFamily: FONT,
                  fontSize: 14,
                  lineHeight: "20px",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="var(--ku-text-faint)" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <span>{s.display}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
