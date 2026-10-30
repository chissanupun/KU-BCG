"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import AppShell from "./components/AppShell";
import SuggestBox from "./components/SuggestBox";

const PRIMARY = "#3b6347";

/** The six pilot KG topics named in the Phase 1 acceptance criteria (gate 1.1.1). */
const SUGGESTIONS = [
  "ชีวมวลและ\nพลังงานทดแทน",
  "ไคโตซานและ\nบรรจุภัณฑ์ชีวภาพ",
  "Microplastics",
  "Carbon Footprint",
  "การเพาะเลี้ยง\nสัตว์น้ำที่ยั่งยืน",
  "วนเกษตร",
].map((display) => ({ display, query: display.replace("\n", "") }));

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

  const search = (text: string) => {
    if (!text.trim()) return;
    router.push(`/learn?q=${encodeURIComponent(text)}`);
  };
  const handleSearch = () => search(query);

  return (
    <AppShell>
      <main className="flex min-h-full flex-col items-center justify-center px-6!" style={{ paddingBottom: 48 }}>
        <div style={{ maxWidth: 928 }} className="flex w-full flex-col">

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
            className="relative flex items-center w-full rounded-[4px]"
            style={{
              background: "var(--ku-search-bg)",
              boxShadow: "var(--ku-search-shadow)",
              paddingRight: 8,
              paddingTop: 8,
              paddingBottom: 8,
              gap: 8,
            }}
          >
            <SuggestBox value={query} onChange={setQuery} onSubmit={search} />
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
          <div className="flex flex-wrap" style={{ marginTop: 32, gap: 22 }}>
            {SUGGESTIONS.map((s, i) => (
              <motion.button
                key={i}
                onClick={() => search(s.query)}
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
    </AppShell>
  );
}
