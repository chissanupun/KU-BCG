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
    title: "เว็บเทคโนโลยีเชิงโต้ตอบด้วย JavaScript",
    info: "~60 ชม. · 4 ระยะ · ระดับเริ่มต้น",
    source: "KU MOCC",
    match: "87%",
    top: true,
  },
  {
    title: "ทฤษฎีสี",
    info: "~60 ชม. · 4 ระยะ · ระดับเริ่มต้น",
    source: "KU MOCC",
    match: "74%",
    top: false,
  },
  {
    title: "ทฤษฎีสี",
    info: "~60 ชม. · 4 ระยะ · ระดับเริ่มต้น",
    source: "KU MOCC",
    match: "68%",
    top: false,
  },
  {
    title: "ทฤษฎีสี",
    info: "~60 ชม. · 4 ระยะ · ระดับเริ่มต้น",
    source: "KU MOCC",
    match: "61%",
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
          position: "absolute", top: -13, left: 22, zIndex: 1,
          background: PRIMARY, color: "#fff",
          fontSize: 13, fontWeight: 700,
          paddingLeft: 14, paddingRight: 14,
          height: 26, borderRadius: 6,
          display: "flex", alignItems: "center",
          fontFamily: FONT,
        }}>
          ตรงที่สุด {pick.match}
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

        {/* Hours info */}
        <p style={{ fontSize: 15, color: "var(--ku-text-muted)", fontFamily: FONT, lineHeight: "22px" }}>
          {pick.info}
        </p>

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
  return (
    <div style={{ width: 1440, height: 900, display: "flex", overflow: "hidden", background: "var(--ku-bg)" }}>
      {/* Sidebar */}
      <div style={{ width: 195, height: 900, flexShrink: 0 }}>
        <Sidebar height={900} activeNav="recommend" />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, height: 900, overflowY: "auto", paddingTop: 44, paddingBottom: 60, fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center" }}>

        <div style={{ width: 600 }}>
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
            Smart Picks
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

        {/* Info box */}
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
            <span style={{ fontWeight: 400 }}>คำแนะนำขึ้นอยู่กับประวัติการเรียนและทักษะของคุณ</span>
          </p>
        </motion.div>

        {/* TOP PICKS label */}
        <motion.p
          {...fadeIn(0.16)}
          style={{ fontSize: 15, fontWeight: 700, color: "var(--ku-text)", marginBottom: 18, fontFamily: FONT }}
        >
          TOP PICKS
        </motion.p>

        {/* Cards */}
        {PICKS.map((pick, i) => (
          <PickCard key={`${pick.title}-${i}`} pick={pick} index={i} />
        ))}
        </div>
      </div>
    </div>
  );
}
