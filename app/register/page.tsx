"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const FIELD_SHADOW = "0px 2px 4px rgba(0,0,0,0.04), 0px 1px 2px rgba(0,0,0,0.06), 0px 0px 0.5px rgba(0,0,0,0.06)";

function TextField({
  label,
  hint,
  left,
  top,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  left: number;
  top: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "absolute", left, top, width: 280 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 400, lineHeight: "24px", color: "#18181b" }}>
          {label}
        </span>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#ff383c" }}>*</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          height: 36,
          background: "white",
          borderRadius: 12,
          border: "none",
          boxShadow: FIELD_SHADOW,
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: 14,
          color: "#18181b",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {hint && (
        <p style={{ margin: "4px 0 0", fontFamily: FONT, fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#71717a" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState({ name: "", surname: "", faculty: "", status: "", studentId: "" });

  const set = (key: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  return (
    <div style={{ width: 1440, height: 900, background: "white", overflow: "hidden", position: "relative" }}>

      {/* Logo — top-left */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 95, height: 93 }}>
        <Image src="/ku-bcg.png" alt="KU Phumpanya" width={95} height={93} className="object-contain" unoptimized />
      </div>

      {/* Green panel */}
      <div
        style={{
          position: "absolute",
          left: 688 + Math.round(752 * 0.2992),
          top: 0,
          width: 752 - Math.round(752 * 0.2992),
          height: 900,
          background: "#8a9e72",
        }}
      />

      {/* Laptop image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/laptop.png"
        alt=""
        style={{
          position: "absolute",
          left: 688 + Math.round(752 * 0.0386),
          top: Math.round(900 * 0.0233),
          width: 723,
          height: 738,
          objectFit: "contain",
          filter: "grayscale(1)",
        }}
      />

      {/* Register heading */}
      <p
        style={{
          position: "absolute",
          left: 139,
          top: 179,
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 600,
          lineHeight: "28px",
          color: "#1a1a1a",
          margin: 0,
        }}
      >
        Register
      </p>

      {/* Subtitle */}
      <p
        style={{
          position: "absolute",
          left: 139,
          top: 217,
          width: 448,
          fontFamily: FONT,
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "24px",
          color: "#737373",
          margin: 0,
        }}
      >
        ตั้งค่าข้อมูลของคุณ
      </p>

      {/* Row 1 */}
      <TextField label="ชื่อ"        left={139} top={292} value={form.name}      onChange={set("name")} />
      <TextField label="คณะและสาขา" left={453} top={292} value={form.faculty}   onChange={set("faculty")} />

      {/* Row 2 */}
      <TextField label="นามสกุล"    left={139} top={385} value={form.surname}   onChange={set("surname")} />
      <TextField label="สถานะ"      left={453} top={388} value={form.status}    onChange={set("status")} hint="นิสิต / อาจารย์" />

      {/* Row 3 */}
      <TextField label="รหัสนิสิต"  left={139} top={476} value={form.studentId} onChange={set("studentId")} hint="อาจารย์กรอก  -" />

      {/* Register button */}
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        style={{
          position: "absolute",
          left: 188,
          top: 648,
          width: 511,
          height: 40,
          background: PRIMARY,
          borderRadius: 4,
          color: "white",
          fontFamily: FONT,
          fontSize: 16,
          fontWeight: 500,
          lineHeight: "24px",
          border: "none",
          cursor: "pointer",
        }}
      >
        Register
      </button>

      {/* Remember me */}
      <div
        style={{
          position: "absolute",
          left: 521,
          top: 710,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <button
          onClick={() => setRemember((r) => !r)}
          aria-label={remember ? "ปิด Remember me" : "เปิด Remember me"}
          style={{
            width: 32,
            height: 16,
            borderRadius: 16,
            background: remember ? PRIMARY : "#ebebec",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <span
            style={{
              display: "block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "white",
              transform: remember ? "translateX(16px)" : "translateX(0)",
              transition: "transform 0.15s",
              boxShadow: "0px 1px 2px rgba(0,0,0,0.06), 0px 1px 1px rgba(0,0,0,0.06), 0px 0px 0.5px rgba(0,0,0,0.06)",
            }}
          />
        </button>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 16,
            fontWeight: 400,
            lineHeight: "24px",
            color: "#18181b",
            whiteSpace: "nowrap",
          }}
        >
          Remember me
        </span>
      </div>
    </div>
  );
}
