"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

const PRIMARY = "#3b6347";

export default function RegisterPage() {
  const [remember, setRemember] = useState(false);

  return (
    <div style={{ width: 1440, height: 900, background: "white", overflow: "hidden", position: "relative" }}>

      {/* Logo — top-left */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 95, height: 93 }}>
        <Image src="/ku-bcg.png" alt="KU Phumpanya" width={95} height={93} className="object-contain" />
      </div>

      {/* Right panel */}
      <div
        style={{
          position: "absolute",
          left: 688,
          top: 0,
          width: 752,
          height: 900,
          background: "#8a9e72",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/laptop-3d.png"
          alt=""
          style={{ position: "absolute", left: 29, top: 21, width: 723, height: 738, objectFit: "contain", filter: "grayscale(1)" }}
        />
      </div>

      {/* Register heading */}
      <p
        style={{
          position: "absolute",
          left: 139,
          top: 193,
          fontFamily: "Poppins, sans-serif",
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
          fontFamily: "Poppins, sans-serif",
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "24px",
          color: "#737373",
          margin: 0,
        }}
      >
        ตั้งค่าข้อมูลของคุณ
      </p>

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
          fontFamily: "Poppins, sans-serif",
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
              boxShadow:
                "0px 1px 2px rgba(0,0,0,0.06), 0px 1px 1px rgba(0,0,0,0.06), 0px 0px 0.5px rgba(0,0,0,0.06)",
            }}
          />
        </button>
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
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
