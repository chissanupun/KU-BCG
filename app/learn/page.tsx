"use client";

import Image from "next/image";
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
      {
        left: 431,
        top: 470,
        title: "ความหมายของ HTML",
        hours: "10–15 ชั่วโมง",
        body: "โครงสร้างเว็บ, แท็กความหมาย, พื้นฐานการเข้าถึง",
      },
      {
        left: 711,
        top: 470,
        title: "พื้นฐาน CSS",
        hours: "10–15 ชั่วโมง",
        body: "บ็อกซ์โมเดล, ตัวเลือก, การต่อเนื่องและความจำเพาะ",
      },
    ],
  },
  {
    id: "Phase 2",
    title: "หลักการออกแบบภาพ",
    desc: `ทฤษฎีการออกแบบที่มีงานวิจัยรองรับ — ไม่ใช่แค่ "ทำให้ดูสวย"`,
    badgeTop: 655,
    descTop: 700,
    cards: [
      {
        left: 426,
        top: 754,
        title: "ทฤษฎีสี",
        hours: "10–15 ชั่วโมง",
        body: "จิตวิทยาสี, ความกลมกลืนของสี",
      },
      {
        left: 706,
        top: 754,
        title: "การออกแบบตัวอักษร",
        hours: "10–15 ชั่วโมง",
        body: "ขนาดตัวอักษร, ความอ่านง่าย, การจับคู่ฟอนต์",
      },
    ],
  },
];

export default function LearnPage() {
  return (
    <div style={{ width: 1440, height: 900, background: "white", overflow: "hidden", position: "relative" }}>

      {/* Sidebar */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 195, height: 900 }}>
        <Sidebar height={900} />
      </div>

      {/* Logo — top right */}
      <div style={{ position: "absolute", left: 1313, top: 11, width: 114, height: 124 }}>
        <Image src="/ku-bcg.png" alt="KU Phumpanya" width={114} height={124} className="object-contain" />
      </div>

      {/* "HTML learning" topic badge */}
      <div
        style={{
          position: "absolute",
          left: 899,
          top: 135,
          width: 192,
          height: 47,
          background: "#eeeeee",
          borderRadius: 5,
          display: "flex",
          alignItems: "center",
          paddingLeft: 35,
        }}
      >
        <p style={{ fontFamily: FONT, fontSize: 14, lineHeight: "20px", color: "#0a0a0a" }}>HTML learning</p>
      </div>

      {/* Overview box */}
      <div
        style={{
          position: "absolute",
          left: 426,
          top: 211,
          width: 569,
          height: 125,
          border: "0.5px solid #737373",
          borderRadius: 5,
        }}
      >
        <p
          style={{
            position: "absolute",
            left: 24,
            top: 16,
            fontFamily: FONT,
            fontSize: 16,
            lineHeight: "24px",
            color: "#737373",
            whiteSpace: "nowrap",
          }}
        >
          ~300–500 ชั่วโมง
        </p>
        <p
          style={{
            position: "absolute",
            left: 24,
            top: 40,
            fontFamily: FONT,
            fontSize: 16,
            lineHeight: "24px",
            color: "#737373",
            whiteSpace: "nowrap",
          }}
        >
          เวลาโดยประมาณทั้งหมด · ตั้งแต่ศูนย์จนถึงระดับมืออาชีพ
        </p>
        {/* Progress meter */}
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 16,
            width: 375,
            height: 4,
            background: "#ebebec",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              width: "82%",
              height: "100%",
              background: PRIMARY,
              borderRadius: 12,
            }}
          />
        </div>
      </div>

      {/* Phases */}
      {PHASES.map((phase) => (
        <div key={phase.id}>
          {/* Phase badge */}
          <div
            style={{
              position: "absolute",
              left: 428,
              top: phase.badgeTop,
              width: 82,
              height: 29,
              background: PRIMARY,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 600, color: "white" }}>{phase.id}</span>
          </div>

          {/* Phase title */}
          <p
            style={{
              position: "absolute",
              left: 525,
              top: phase.badgeTop + 2,
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 700,
              lineHeight: "24px",
              color: "#000",
            }}
          >
            {phase.title}
          </p>

          {/* Phase description */}
          <p
            style={{
              position: "absolute",
              left: 430,
              top: phase.descTop,
              width: 448,
              fontFamily: FONT,
              fontSize: 16,
              lineHeight: "24px",
              color: "#000",
            }}
          >
            {phase.desc}
          </p>

          {/* Cards */}
          {phase.cards.map((card) => (
            <div
              key={card.title}
              style={{
                position: "absolute",
                left: card.left,
                top: card.top,
                width: 250,
                height: 150,
                border: "0.5px solid #737373",
                borderRadius: 5,
                background: "white",
                padding: "18px 20px",
              }}
            >
              <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, lineHeight: "24px", color: "#000" }}>
                {card.title}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: "24px", color: "#737373", marginTop: 4 }}>
                {card.hours}
              </p>
              <p style={{ fontFamily: FONT, fontSize: 16, lineHeight: "24px", color: "#737373" }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
