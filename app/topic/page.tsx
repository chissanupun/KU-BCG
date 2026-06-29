"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const TAGS = [
  { label: "การเขียนโปรแกรม", width: 135 },
  { label: "พัฒนาเว็บ", width: 98 },
];

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

/* Mind map node colors */
const NODES = [
  { label: "HTML Semantics", color: PRIMARY, cx: 303, cy: 187, r: 52, textColor: "#fff" },
  { label: "Navigation\n& Links", color: "#eab308", cx: 490, cy: 90, r: 38, textColor: "#fff" },
  { label: "Text\nSemantics", color: "#ec4899", cx: 530, cy: 230, r: 36, textColor: "#fff" },
  { label: "Structural\nElements", color: "#84cc16", cx: 460, cy: 340, r: 38, textColor: "#fff" },
  { label: "Forms &\nInputs", color: "#a855f7", cx: 150, cy: 330, r: 38, textColor: "#fff" },
  { label: "ARIA\nRoles", color: "#22c55e", cx: 110, cy: 190, r: 36, textColor: "#fff" },
  { label: "Media &\nTables", color: "#06b6d4", cx: 175, cy: 70, r: 36, textColor: "#fff" },
];

function MindMap() {
  const center = NODES[0];
  return (
    <svg width={606} height={420} style={{ display: "block" }}>
      {/* Dashed connecting lines */}
      {NODES.slice(1).map((node, i) => (
        <line
          key={i}
          x1={center.cx} y1={center.cy}
          x2={node.cx} y2={node.cy}
          stroke="rgba(59,99,71,0.3)"
          strokeWidth={1.5}
          strokeDasharray="6,4"
        />
      ))}
      {/* Nodes */}
      {NODES.map((node) => {
        const lines = node.label.split("\n");
        return (
          <g key={node.label}>
            <circle cx={node.cx} cy={node.cy} r={node.r} fill={node.color} />
            {lines.map((line, li) => (
              <text
                key={li}
                x={node.cx}
                y={node.cy + (li - (lines.length - 1) / 2) * 14}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={node.r > 45 ? 11 : 9.5}
                fontWeight={600}
                fill={node.textColor}
                fontFamily={FONT}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function TopicPage() {
  return (
    <div style={{ width: 1440, height: 900, display: "flex", overflow: "hidden", background: "var(--ku-bg)" }}>
      {/* Sidebar */}
      <div style={{ width: 195, height: 900, flexShrink: 0 }}>
        <Sidebar height={900} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, height: 900, overflowY: "auto", position: "relative", fontFamily: FONT }}>

        {/* Logo */}
        <div style={{ position: "absolute", right: 18, top: 10, width: 114, height: 124, zIndex: 10 }}>
          <Image src="/ku-bcg.png" alt="KU Phumpanya" width={114} height={124} className="object-contain ku-logo" unoptimized />
        </div>

        <div style={{ paddingLeft: 226, paddingRight: 36, paddingTop: 44, paddingBottom: 60 }}>

          {/* Topic badge */}
          <motion.div
            {...fadeIn(0)}
            style={{
              position: "absolute", left: 731, top: 134, width: 139, height: 44,
              background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)",
              borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text)" }}>HTML Semantics</p>
          </motion.div>

          {/* Overview box */}
          <motion.div
            {...fadeIn(0.06)}
            style={{
              width: 569, marginTop: 165, marginBottom: 20,
              background: "var(--ku-overview-bg)", border: "0.5px solid var(--ku-overview-border)", borderRadius: 8,
              padding: "25px 24px 16px", position: "relative",
            }}
          >
            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, lineHeight: "20px", color: "var(--ku-text-muted)" }}>
              10–15 ชั่วโมง
            </p>
            <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 2 }}>
              เวลาโดยประมาณทั้งหมด · ตั้งแต่ศูนย์จนถึงระดับมืออาชีพ
            </p>
            <div style={{ marginTop: 16, width: 375, height: 4, background: "var(--ku-progress-track)", borderRadius: 12 }}>
              <div style={{ width: "82%", height: "100%", background: "var(--ku-progress-fill)", borderRadius: 12 }} />
            </div>
          </motion.div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {TAGS.map((tag, i) => (
              <motion.div
                key={tag.label}
                {...fadeIn(0.1 + i * 0.055)}
                style={{
                  width: tag.width, height: 30,
                  background: "var(--ku-tag-bg)", border: "0.5px solid var(--ku-tag-border)",
                  borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text)" }}>{tag.label}</span>
              </motion.div>
            ))}
          </div>

          {/* Active tab + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <motion.div
              {...fadeIn(0.14)}
              style={{
                width: 121, height: 30,
                background: PRIMARY, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "var(--ku-badge-shadow)", flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>Introduction</span>
            </motion.div>
            <motion.p
              {...fadeIn(0.14)}
              style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, lineHeight: "24px", color: "var(--ku-text)" }}
            >
              ความหมายของ HTML
            </motion.p>
          </div>

          <motion.p
            {...fadeIn(0.18)}
            style={{ fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)", marginBottom: 20, maxWidth: 448 }}
          >
            โครงสร้างเว็บ, แท็กความหมาย, พื้นฐานการเข้าถึง
          </motion.p>

          <motion.div {...fadeIn(0.2)} style={{ maxWidth: 507, marginBottom: 32 }}>
            <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: "24px", color: "var(--ku-text)", marginBottom: 8 }}>
              HTML ความหมายเชิงความหมาย คือการใช้มาร์กอัป HTML เพื่อเสริมความหมายของข้อมูลในหน้าเว็บและเว็บแอปพลิเคชัน
              มากกว่าแค่การนำเสนอรูปแบบ
            </p>
            <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: "24px", color: "var(--ku-text)" }}>
              {`ลองคิดแบบนี้: แท็ก <div> บอกเบราว์เซอร์ว่า "นี่คือกล่อง"`}
            </p>
          </motion.div>

          {/* Divider 1 */}
          <motion.div {...fadeIn(0.24)} style={{ width: 562, height: 1, background: "var(--ku-divider-line)", opacity: 0.5, marginBottom: 22 }} />

          <motion.div {...fadeIn(0.26)} style={{ maxWidth: 371, marginBottom: 40 }}>
            <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, lineHeight: "22px", color: "var(--ku-text)", marginBottom: 8 }}>
              พื้นฐานงานวิจัย: Bowen (2008):
            </p>
            <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)", marginBottom: 8 }}>
              HTML ความหมายเชิงความหมายช่วยลดภาระทางปัญญา
            </p>
            <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)" }}>
              สำหรับผู้ใช้โปรแกรมอ่านหน้าจอได้ถึง ~40% และปรับปรุงประสิทธิภาพการนำทางอย่างมีนัยสำคัญ
            </p>
          </motion.div>

          {/* Divider 2 */}
          <motion.div {...fadeIn(0.3)} style={{ width: 562, height: 1, background: "var(--ku-divider-line)", opacity: 0.5, marginBottom: 22 }} />

          <motion.p
            {...fadeIn(0.32)}
            style={{ fontFamily: FONT, fontSize: 14, lineHeight: "24px", color: "var(--ku-text)", maxWidth: 477, marginBottom: 48 }}
          >
            <span style={{ fontWeight: 600 }}>ผู้เชี่ยวชาญ / ศาสตราจารย์: </span>
            <span style={{ fontWeight: 400, color: "var(--ku-text-muted)" }}>Jeffrey Zeldman (A Book Apart)</span>
          </motion.p>

          {/* Mind Map section */}
          <motion.div {...fadeIn(0.36)}>
            <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 600, color: "var(--ku-text)", marginBottom: 16 }}>แผนที่ความรู้</p>
            <div style={{
              width: 606, borderRadius: 12, overflow: "hidden",
              border: "0.5px solid var(--ku-card-border)", background: "var(--ku-card-bg)",
              padding: "16px 0 10px", position: "relative",
            }}>
              {/* Controls inside graph box */}
              <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6, zIndex: 1 }}>
                {["กรอง", "ซูมเข้า", "ซูมออก"].map((label) => (
                  <button
                    key={label}
                    style={{
                      height: 28, paddingLeft: 10, paddingRight: 10, borderRadius: 6,
                      border: "0.5px solid var(--ku-card-border)", background: "var(--ku-bg)",
                      fontSize: 11, color: "var(--ku-text-muted)", cursor: "pointer", fontFamily: FONT,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <MindMap />
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
