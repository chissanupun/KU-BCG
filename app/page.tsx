"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const PRIMARY = "#3b6347";

const SUGGESTIONS = [
  { display: "การวิเคราะห์\nคาร์บอน นาโนทิวบ์", query: "การวิเคราะห์คาร์บอนนาโนทิวบ์" },
  { display: "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024", query: "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024" },
  { display: "ผลการวิจัยสำคัญ\nด้านโครงข่าย ประสาท", query: "ผลการวิจัยสำคัญด้านโครงข่ายประสาท" },
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/api/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white relative">

      {/* Logo — absolute top-right of full page */}
      <div
        className="absolute flex flex-col items-center"
        style={{ top: 12, right: 27, zIndex: 10 }}
      >
        <Image
          src="/logo.png"
          alt="KU Phumpanya"
          width={80}
          height={80}
          className="object-contain"
        />
        <p className="text-[10px] mt-1 tracking-widest font-bold">
          <span style={{ color: PRIMARY }}>KU</span>{" "}
          <span style={{ color: "#9ca3af" }}>Phumpanya</span>
        </p>
      </div>

      {/* ── Sidebar 195px ─────────────────────────────── */}
      <aside
        className="w-[195px] shrink-0 flex flex-col bg-white h-screen"
        style={{ borderRight: "0.5px solid rgba(115,115,115,0.5)" }}
      >
        {/* User Profile */}
        <div
          className="flex items-center shrink-0"
          style={{ paddingLeft: 18.5, paddingTop: 50, paddingBottom: 14, paddingRight: 18.5, gap: 9 }}
        >
          <div
            className="rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0"
            style={{ width: 36.5, height: 36.5 }}
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                className="w-full h-full object-cover"
                alt="avatar"
              />
            ) : (
              <svg
                style={{ width: 16, height: 16, color: "#9ca3af" }}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] leading-[16px] truncate" style={{ color: "rgba(36,34,32,0.4)" }}>
              Free plan
            </p>
            <p className="text-[12px] leading-[16px] truncate" style={{ color: "#242220" }}>
              {session?.user?.name || "ผู้เยี่ยมชม"}
            </p>
          </div>
        </div>

        {/* Divider 1 */}
        <div style={{ height: 0.38, background: PRIMARY, opacity: 0.24, flexShrink: 0 }} />

        {/* Main Nav */}
        <div
          className="shrink-0"
          style={{ paddingLeft: 18.5, paddingRight: 18.5, paddingTop: 12 }}
        >
          <p
            className="text-[12px] leading-[16px] mb-[7px]"
            style={{ color: "rgba(36,34,32,0.4)", paddingLeft: 15 }}
          >
            หลัก
          </p>
          <button
            className="flex items-center w-full rounded-[9px] hover:bg-gray-50 transition-colors"
            style={{ gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12 }}
          >
            <svg
              style={{ width: 16, height: 16, flexShrink: 0 }}
              fill="none"
              stroke="rgba(36,34,32,0.56)"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
              />
            </svg>
            <span className="text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.56)" }}>
              ค้นหา
            </span>
          </button>
        </div>

        {/* Divider 2 */}
        <div
          style={{ height: 0.38, background: PRIMARY, opacity: 0.24, flexShrink: 0, marginTop: 8 }}
        />

        {/* Recent Section */}
        <div
          className="flex items-center shrink-0"
          style={{ paddingLeft: 18.5 + 15, paddingRight: 18.5 + 3, paddingTop: 12, paddingBottom: 12 }}
        >
          <p className="flex-1 text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.4)" }}>
            ล่าสุด
          </p>
          <span className="text-[12px]" style={{ color: "rgba(36,34,32,0.4)" }}>
            +
          </span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Promo Block */}
        {!session && (
          <div style={{ padding: "0 18.5px 20px" }}>
            <div
              className="flex flex-col rounded-[21px]"
              style={{
                border: `1px solid ${PRIMARY}`,
                background: "rgba(255,255,255,0.12)",
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 18,
                paddingBottom: 12,
                gap: 11,
              }}
            >
              <div className="text-center flex flex-col" style={{ gap: 4.5 }}>
                <p className="text-[12px] leading-[16px] font-medium" style={{ color: "#242220" }}>
                  เริ่มต้นกัน !
                </p>
                <p className="text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.56)" }}>
                  การค้นหาหรือ
                  <br />
                  จัดระเบียบงานวิจัย
                </p>
              </div>
              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex items-center justify-center font-medium text-[14px] leading-[20px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity"
                style={{
                  background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY} 100%)`,
                  boxShadow: "0px 3px 9px rgba(59,99,71,0.3)",
                  height: 36.5,
                  gap: 4.5,
                }}
              >
                <span>+</span>
                <span>เข้าสู่ระบบ</span>
              </button>
              <button
                onClick={() => signIn("google", { callbackUrl: "/register" })}
                className="flex items-center justify-center font-medium text-[14px] leading-[20px] rounded-[9px] w-full hover:opacity-90 transition-opacity"
                style={{
                  border: `1px solid ${PRIMARY}`,
                  background: "#ffffff",
                  color: PRIMARY,
                  boxShadow: "0px 3px 9px rgba(59,99,71,0.3)",
                  height: 36.5,
                }}
              >
                ลงทะเบียน
              </button>
            </div>
          </div>
        )}

        {session && (
          <button
            onClick={() => signOut()}
            className="text-[12px] leading-[16px] hover:opacity-70 transition-opacity text-left"
            style={{ color: "rgba(36,34,32,0.4)", padding: "0 18.5px 20px" }}
          >
            ออกจากระบบ
          </button>
        )}
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center">
        {/* 928px content column */}
        <div style={{ width: 928 }} className="flex flex-col">
          {/* Hero */}
          <div className="flex items-center justify-center" style={{ gap: 10 }}>
            <Image src="/star.svg" alt="" width={60} height={60} />
            <h1
              style={{
                fontFamily: "var(--font-abhaya), serif",
                fontSize: 36,
                fontWeight: 400,
                lineHeight: "80px",
                color: "#171717",
                whiteSpace: "nowrap",
              }}
            >
              Start your next discovery.
            </h1>
          </div>

          {/* Search Bar */}
          <div
            className="flex items-center w-full rounded-[4px] overflow-hidden"
            style={{
              background: "linear-gradient(to top, #ffffff 0%, #f4f4f5 100%)",
              boxShadow:
                "0px 0px 0px 1px rgba(212,212,216,0.5), 0px 8px 30px 0px rgba(0,0,0,0.12)",
              paddingRight: 8,
              paddingTop: 8,
              paddingBottom: 8,
              gap: 8,
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="วันนี้อยากสำรวจเรื่องอะไร?"
              className="flex-1 outline-none bg-transparent text-[16px] text-[#171717] placeholder:text-[#a1a1a1]"
              style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14 }}
            />
            <button
              onClick={handleSearch}
              className="shrink-0 text-[16px] text-white whitespace-nowrap rounded-[4px] hover:opacity-90 transition-opacity"
              style={{
                background: PRIMARY,
                paddingLeft: 74,
                paddingRight: 76,
                paddingTop: 14,
                paddingBottom: 14,
                boxShadow:
                  "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
              }}
            >
              เริ่มต้น
            </button>
          </div>

          {/* Suggestion Cards */}
          <div className="flex" style={{ marginTop: 31, gap: 22 }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => setQuery(s.query)}
                className="bg-white hover:border-[#3b6347] transition-colors group text-left"
                style={{
                  width: 114,
                  height: 100,
                  border: "0.5px solid #a1a1a1",
                  borderRadius: 15,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 15,
                  paddingBottom: 14,
                }}
              >
                <span
                  className="text-[14px] leading-[20px] group-hover:text-[#3b6347] transition-colors block whitespace-pre-line"
                  style={{ color: "#a1a1a1" }}
                >
                  {s.display}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
