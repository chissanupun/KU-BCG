"use client";

import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

const PICKS = [
  {
    title: "HTML Semantics & Web Accessibility",
    subtitle: "ความหมายของ HTML · การเข้าถึงเว็บ · โครงสร้างเอกสาร",
    hours: "10–15 ชั่วโมง",
    match: "87%",
    reason: "ตรงกับประวัติการค้นหาและระดับทักษะปัจจุบันของคุณ",
    top: true,
  },
  {
    title: "CSS Layout Mastery: Flexbox & Grid",
    subtitle: "Flexbox · CSS Grid · Responsive Design",
    hours: "12–18 ชั่วโมง",
    match: "74%",
    reason: "เสริมต่อจากพื้นฐาน HTML ที่คุณกำลังเรียน",
    top: false,
  },
  {
    title: "JavaScript Fundamentals for Web",
    subtitle: "DOM · Events · Async/Await · ES6+",
    hours: "20–30 ชั่วโมง",
    match: "68%",
    reason: "ขั้นตอนถัดไปในเส้นทาง Web Developer",
    top: false,
  },
  {
    title: "TypeScript for React Developers",
    subtitle: "Type Safety · Generics · Interface · Utility Types",
    hours: "15–20 ชั่วโมง",
    match: "61%",
    reason: "ทักษะที่ตลาดงานต้องการสูงในปัจจุบัน",
    top: false,
  },
];

function PickCard({ pick, index }: { pick: typeof PICKS[0]; index: number }) {
  const isTop = pick.top;
  return (
    <motion.div
      {...fadeIn(0.22 + index * 0.07)}
      style={{ position: "relative", marginBottom: 16 }}
    >
      {isTop && (
        <div style={{
          position: "absolute", top: -10, left: 22,
          background: PRIMARY, color: "#fff",
          fontSize: 11, fontWeight: 600, paddingLeft: 10, paddingRight: 10,
          height: 26, borderRadius: 6, display: "flex", alignItems: "center", gap: 5, zIndex: 1,
          fontFamily: FONT,
        }}>
          <svg width={10} height={10} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          ตรงที่สุด {pick.match}
        </div>
      )}
      <motion.div
        whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.99, transition: { duration: 0.1 } }}
        style={{
          width: "100%",
          background: "var(--ku-card-bg)",
          border: isTop ? `2px solid ${PRIMARY}` : "0.5px solid var(--ku-card-border)",
          borderRadius: 12,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column" as const,
          gap: 8,
          paddingTop: isTop ? 24 : 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ku-text)", lineHeight: "22px", fontFamily: FONT }}>{pick.title}</p>
            <p style={{ fontSize: 12, color: "var(--ku-text-muted)", lineHeight: "18px", marginTop: 2, fontFamily: FONT }}>{pick.subtitle}</p>
          </div>
          <button
            style={{
              flexShrink: 0,
              height: 34, paddingLeft: 16, paddingRight: 16, borderRadius: 8,
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: FONT, whiteSpace: "nowrap" as const,
              ...(isTop
                ? { background: PRIMARY, border: "none", color: "#fff" }
                : { background: "transparent", border: `1px solid ${PRIMARY}`, color: PRIMARY }),
            }}
          >
            ดูเพิ่มเติม
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: "var(--ku-text-muted)", fontFamily: FONT }}>{pick.hours}</span>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--ku-text-muted)", display: "inline-block" }} />
          <span style={{ fontSize: 11, color: "var(--ku-text-muted)", fontFamily: FONT }}>{pick.reason}</span>
        </div>
        {!isTop && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ height: 3, borderRadius: 3, background: `rgba(59,99,71,0.2)`, flex: 1 }}>
              <div style={{ height: "100%", borderRadius: 3, background: PRIMARY, width: `${pick.match}` }} />
            </div>
            <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, fontFamily: FONT }}>{pick.match}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function SmartPicksPage() {
  return (
    <div style={{ width: 1440, height: 900, display: "flex", overflow: "hidden", background: "var(--ku-bg)" }}>
      {/* Sidebar */}
      <div style={{ width: 195, height: 900, flexShrink: 0 }}>
        <Sidebar height={900} activeNav="recommend" />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, height: 900, overflowY: "auto", paddingTop: 44, paddingBottom: 60, fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 620 }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
          <motion.div
            {...fadeIn(0)}
            style={{
              background: PRIMARY, color: "#fff",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
              paddingLeft: 12, paddingRight: 12, height: 29, borderRadius: 6,
              display: "flex", alignItems: "center", fontFamily: FONT,
            }}
          >
            SMART PICKS
          </motion.div>
          <motion.h1
            {...fadeIn(0.04)}
            style={{ fontSize: 20, fontWeight: 700, color: "var(--ku-text)", fontFamily: FONT }}
          >
            คำแนะนำจาก AI สำหรับคุณ
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          {...fadeIn(0.08)}
          style={{ fontSize: 13, color: "var(--ku-text-muted)", lineHeight: "20px", marginBottom: 24, fontFamily: FONT }}
        >
          วิเคราะห์จากประวัติการเรียนรู้และพฤติกรรมการค้นหาของคุณ · อัปเดตทุกสัปดาห์
        </motion.p>

        {/* Info box */}
        <motion.div
          {...fadeIn(0.12)}
          style={{
            width: "100%", borderRadius: 10,
            background: "rgba(23,201,100,0.2)",
            border: "1px solid rgba(23,201,100,0.3)",
            padding: "14px 18px",
            marginBottom: 28,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}
        >
          <svg style={{ flexShrink: 0, marginTop: 1 }} width={16} height={16} fill="none" stroke="#16a34a" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#15803d", marginBottom: 3, fontFamily: FONT }}>AI วิเคราะห์แล้ว</p>
            <p style={{ fontSize: 12, color: "#16a34a", lineHeight: "18px", fontFamily: FONT }}>
              จากการค้นหา 23 ครั้งล่าสุดและเวลาที่ใช้ในแต่ละหัวข้อ AI แนะนำให้เริ่มต้นด้วย HTML Semantics
              เพื่อสร้างรากฐานที่แข็งแกร่งก่อนไปเรียน CSS และ JavaScript
            </p>
          </div>
        </motion.div>

        {/* TOP PICKS label */}
        <motion.p
          {...fadeIn(0.16)}
          style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--ku-text-muted)", marginBottom: 18, fontFamily: FONT, textTransform: "uppercase" as const }}
        >
          TOP PICKS
        </motion.p>

        {/* Cards */}
        {PICKS.map((pick, i) => (
          <PickCard key={pick.title} pick={pick} index={i} />
        ))}
        </div>
      </div>
    </div>
  );
}
