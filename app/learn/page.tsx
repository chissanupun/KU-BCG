"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const PHASES = [
  {
    id: "Phase 1",
    title: "รากฐาน",
    desc: "ก่อนออกแบบ ต้องเข้าใจสื่อก่อน — เหมือนจิตรกรที่ต้องรู้จักผืนผ้าใบ",
    badgeTop: 373,
    descTop: 418,
    cards: [
      { left: 431, top: 470, title: "ความหมายของ HTML", hours: "10–15 ชั่วโมง", body: "โครงสร้างเว็บ, แท็กความหมาย, พื้นฐานการเข้าถึง", href: "/topic" },
      { left: 711, top: 470, title: "พื้นฐาน CSS", hours: "10–15 ชั่วโมง", body: "บ็อกซ์โมเดล, ตัวเลือก, การต่อเนื่องและความจำเพาะ", href: undefined },
    ],
  },
  {
    id: "Phase 2",
    title: "หลักการออกแบบภาพ",
    desc: `ทฤษฎีการออกแบบที่มีงานวิจัยรองรับ — ไม่ใช่แค่ "ทำให้ดูสวย"`,
    badgeTop: 655,
    descTop: 700,
    cards: [
      { left: 426, top: 754, title: "ทฤษฎีสี", hours: "10–15 ชั่วโมง", body: "จิตวิทยาสี, ความกลมกลืนของสี", href: undefined },
      { left: 706, top: 754, title: "การออกแบบตัวอักษร", hours: "10–15 ชั่วโมง", body: "ขนาดตัวอักษร, ความอ่านง่าย, การจับคู่ฟอนต์", href: undefined },
    ],
  },
];

const cardHoverOn = (el: HTMLElement) => {
  el.style.borderColor = "rgba(59,99,71,0.6)";
  el.style.boxShadow = "0 0 24px rgba(59,99,71,0.15)";
};
const cardHoverOff = (el: HTMLElement) => {
  el.style.borderColor = "var(--ku-card-border)";
  el.style.boxShadow = "none";
};

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

export default function LearnPage() {
  return (
    <div style={{ width: 1440, height: 900, background: "var(--ku-bg)", overflow: "hidden", position: "relative" }}>

      <div style={{ position: "absolute", left: 0, top: 0, width: 195, height: 900 }}>
        <Sidebar height={900} />
      </div>

      <div style={{ position: "absolute", left: 1313, top: 11, width: 114, height: 124 }}>
        <Image src="/ku-bcg.png" alt="KU Phumpanya" width={114} height={124} className="object-contain ku-logo" unoptimized />
      </div>

      {/* Topic badge */}
      <motion.div
        {...fadeIn(0)}
        style={{
          position: "absolute", left: 899, top: 135, width: 192, height: 44,
          background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)",
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text)" }}>HTML learning</p>
      </motion.div>

      {/* Overview box */}
      <motion.div
        {...fadeIn(0.06)}
        style={{
          position: "absolute", left: 426, top: 211, width: 569, height: 125,
          background: "var(--ku-overview-bg)", border: "0.5px solid var(--ku-overview-border)", borderRadius: 8,
        }}
      >
        <p style={{ position: "absolute", left: 24, top: 16, fontFamily: FONT, fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text-muted)", whiteSpace: "nowrap" }}>
          ~300–500 ชั่วโมง
        </p>
        <p style={{ position: "absolute", left: 24, top: 40, fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", whiteSpace: "nowrap" }}>
          เวลาโดยประมาณทั้งหมด · ตั้งแต่ศูนย์จนถึงระดับมืออาชีพ
        </p>
        <div style={{ position: "absolute", left: 24, bottom: 16, width: 375, height: 4, background: "var(--ku-progress-track)", borderRadius: 12 }}>
          <div style={{ width: "82%", height: "100%", background: "var(--ku-progress-fill)", borderRadius: 12 }} />
        </div>
      </motion.div>

{PHASES.map((phase, pi) => (
        <div key={phase.id}>
          {/* Phase badge */}
          <motion.div
            {...fadeIn(0.14 + pi * 0.07)}
            style={{
              position: "absolute", left: 428, top: phase.badgeTop, width: 82, height: 30,
              background: PRIMARY, borderRadius: 6,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--ku-badge-shadow)",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{phase.id}</span>
          </motion.div>

          <motion.p
            {...fadeIn(0.14 + pi * 0.07)}
            style={{ position: "absolute", left: 525, top: phase.badgeTop + 3, fontFamily: FONT, fontSize: 15, fontWeight: 600, lineHeight: "24px", color: "var(--ku-text)" }}
          >
            {phase.title}
          </motion.p>

          <motion.p
            {...fadeIn(0.18 + pi * 0.07)}
            style={{ position: "absolute", left: 430, top: phase.descTop, width: 448, fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)" }}
          >
            {phase.desc}
          </motion.p>

          {phase.cards.map((card, ci) => {
            const cardStyle = {
              position: "absolute" as const,
              left: card.left, top: card.top, width: 250, height: 150,
              background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)",
              borderRadius: 10, padding: "18px 20px",
              transition: "border-color 0.2s, box-shadow 0.2s",
            };
            const inner = (
              <>
                <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, lineHeight: "22px", color: "var(--ku-text)" }}>{card.title}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 6 }}>{card.hours}</p>
                <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 2 }}>{card.body}</p>
              </>
            );
            const motionProps = {
              ...fadeIn(0.2 + pi * 0.07 + ci * 0.055),
              whileHover: { scale: 1.02, transition: { duration: 0.15 } },
              whileTap: { scale: 0.97, transition: { duration: 0.1 } },
            };
            return card.href ? (
              <motion.div
                key={card.title}
                style={cardStyle}
                {...motionProps}
                onMouseEnter={(e) => cardHoverOn(e.currentTarget as HTMLElement)}
                onMouseLeave={(e) => cardHoverOff(e.currentTarget as HTMLElement)}
              >
                <Link href={card.href} style={{ display: "block", width: "100%", height: "100%", textDecoration: "none" }}>
                  {inner}
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key={card.title}
                style={cardStyle}
                {...motionProps}
                onMouseEnter={(e) => cardHoverOn(e.currentTarget as HTMLElement)}
                onMouseLeave={(e) => cardHoverOff(e.currentTarget as HTMLElement)}
              >
                {inner}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
