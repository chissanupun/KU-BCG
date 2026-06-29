"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Sidebar from "./components/Sidebar";

const PRIMARY = "#3b6347";

const SUGGESTIONS = [
  { display: "การวิเคราะห์ คาร์บอน นาโนทิวบ์", query: "การวิเคราะห์คาร์บอนนาโนทิวบ์" },
  { display: "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024", query: "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024" },
  { display: "ผลการวิจัยสำคัญ\nด้านโครงข่าย ประสาท", query: "ผลการวิจัยสำคัญด้านโครงข่ายประสาท" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.055, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/learn?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: "var(--ku-bg)" }}>

      {/* Logo */}
      <div className="absolute" style={{ top: 20, right: 27, zIndex: 10 }}>
        <Image src="/ku-bcg.png" alt="KU Phumpanya" width={114} height={124} className="object-contain ku-logo" unoptimized />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center" style={{ paddingBottom: 48 }}>
        <div style={{ width: 928 }} className="flex flex-col">

          {/* Hero */}
          <motion.div
            className="flex items-center justify-center"
            style={{ gap: 10 }}
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeUp}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            >
              <Image
                src="/star.svg"
                alt=""
                width={60}
                height={60}
              />
            </motion.div>
            <h1
              style={{
                fontFamily: "var(--font-abhaya), serif",
                fontSize: 36,
                fontWeight: 400,
                lineHeight: "80px",
                color: "var(--ku-text)",
                whiteSpace: "nowrap",
              }}
            >
              Start your next discovery.
            </h1>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial="hidden"
            animate="visible"
            custom={1}
            variants={fadeUp}
            className="flex items-center w-full rounded-[4px] overflow-hidden"
            style={{
              background: "var(--ku-search-bg)",
              boxShadow: focused ? "var(--ku-search-shadow-focus)" : "var(--ku-search-shadow)",
              paddingRight: 8,
              paddingTop: 8,
              paddingBottom: 8,
              gap: 8,
              transition: "box-shadow 0.25s ease",
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="วันนี้อยากสำรวจเรื่องอะไร?"
              className="flex-1 outline-none bg-transparent text-[16px]"
              style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14, color: "var(--ku-text)" }}
            />
            <button
              onClick={handleSearch}
              className="shrink-0 text-[16px] text-white whitespace-nowrap rounded-[4px] hover:opacity-90 active:scale-[0.98] transition-all"
              aria-label="เริ่มค้นหา"
              style={{
                background: PRIMARY,
                paddingLeft: 74,
                paddingRight: 76,
                paddingTop: 14,
                paddingBottom: 14,
                boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
              }}
            >
              เริ่มต้น
            </button>
          </motion.div>

          {/* Suggestion Cards */}
          <div className="flex" style={{ marginTop: 32, gap: 22 }}>
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                onClick={() => setQuery(s.query)}
                initial="hidden"
                animate="visible"
                custom={i + 2}
                variants={fadeUp}
                whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                className="text-left"
                style={{
                  width: 114,
                  height: 100,
                  background: "var(--ku-card-bg)",
                  border: "0.5px solid var(--ku-card-border)",
                  borderRadius: 10,
                  paddingLeft: 12,
                  paddingRight: 12,
                  paddingTop: 15,
                  paddingBottom: 14,
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(59,99,71,0.6)";
                  el.style.boxShadow = "0 0 20px rgba(59,99,71,0.15)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "var(--ku-card-border)";
                  el.style.boxShadow = "none";
                }}
              >
                <span
                  className="text-[13px] leading-[19px] block whitespace-pre-line"
                  style={{ color: "var(--ku-text-muted)", wordBreak: "keep-all", overflowWrap: "break-word" }}
                >
                  {s.display}
                </span>
              </motion.button>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
