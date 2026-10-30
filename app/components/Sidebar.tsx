"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeProvider";
import { useUser } from "@/lib/UserContext";
import { useSearchHistory } from "@/lib/SearchHistoryContext";
import { googleLoginUrl } from "@/lib/api";

const PRIMARY = "#3b6347";

function NavItem({ href, label, active, d, strokeWidth = 1.8 }: { href: string; label: string; active: boolean; d: string; strokeWidth?: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} style={{ display: "block", textDecoration: "none" }}>
      <div
        className="flex items-center w-full rounded-[9px] transition-all relative overflow-hidden hover:bg-[var(--ku-hover-bg)]"
        style={{
          gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12, minHeight: 44,
          ...(active
            ? { background: "var(--ku-nav-active-bg)", border: "0.38px solid var(--ku-nav-active-border)" }
            : { border: "0.38px solid transparent" }),
        }}
      >
        <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke={active ? "var(--ku-icon-active)" : "var(--ku-text-muted)"} strokeWidth={strokeWidth} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
        <span className="flex-1 text-[12px] leading-[16px] text-left" style={{ color: active ? "var(--ku-text)" : "var(--ku-text-muted)", fontWeight: active ? 500 : 400 }}>{label}</span>
        {active && (
          <svg style={{ width: 16, height: 16, flexShrink: 0, color: "var(--ku-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </Link>
  );
}

export default function Sidebar({
  height = "100%",
  activeNav = "search",
}: {
  height?: number | string;
  activeNav?: "search" | "recommend" | "progress" | "admin";
}) {
  const { user, logout } = useUser();
  const { items: recentSearches, clear: clearHistory } = useSearchHistory();

  /**
   * Clearing is irreversible and cascades to the completion ticks recorded
   * against those roadmaps, so the button asks once before it fires.
   */
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearHistory();
      setConfirmingClear(false);
    } catch {
      // Nothing was deleted, so the list still stands — drop back to the plain
      // header rather than leaving the user stuck on a confirm that failed.
      setConfirmingClear(false);
    } finally {
      setClearing(false);
    }
  };

  /**
   * Google avatar URLs intermittently fail to load in-browser (hotlink throttling
   * on lh3.googleusercontent.com). The broken-image glyph escapes the 36.5px
   * circle, so a failed load falls back to the placeholder instead.
   */
  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [user?.avatar_url]);
  const showAvatar = Boolean(user?.avatar_url) && !avatarFailed;

  const handleLogin = () => {
    window.location.href = googleLoginUrl();
  };

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{ width: 195, height, background: "var(--ku-bg)", borderRight: "0.5px solid var(--ku-sidebar-border)" }}
    >
      {/* User Profile */}
      <Link
        href="/profile"
        className="flex items-center shrink-0"
        aria-label="โปรไฟล์ผู้ใช้"
        style={{ paddingLeft: 18.5, paddingTop: 50, paddingBottom: 14, paddingRight: 18.5, gap: 9, textDecoration: "none" }}
      >
        <div
          className="rounded-full flex items-center justify-center overflow-hidden shrink-0"
          style={{ width: 36.5, height: 36.5, background: "var(--ku-avatar-bg)", border: "0.5px solid var(--ku-avatar-border)" }}
        >
          {showAvatar ? (
            <img
              src={user!.avatar_url!}
              width={36.5}
              height={36.5}
              // Google rejects hotlinks carrying a localhost referrer.
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
              style={{ display: "block", maxWidth: "100%" }}
              alt=""
            />
          ) : (
            <svg style={{ width: 16, height: 16, color: "var(--ku-text-muted)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] leading-[16px] truncate" style={{ color: "var(--ku-text-faint)" }}>แผนฟรี</p>
          <p className="text-[12px] leading-[16px] truncate" style={{ color: "var(--ku-text)" }}>{user?.name || "ผู้เยี่ยมชม"}</p>
        </div>
      </Link>

      {/* Divider 1 */}
      <div style={{ height: 0.38, background: "var(--ku-divider)", flexShrink: 0 }} />

      {/* Main Nav */}
      <div className="shrink-0" style={{ paddingLeft: 18.5, paddingRight: 18.5, paddingTop: 18, paddingBottom: 6 }}>
        <p className="text-[12px] leading-[16px] mb-[12px]" style={{ color: "var(--ku-text-faint)", paddingLeft: 15 }}>หลัก</p>

        {/* The rows sit flush against each other at 44px tall, which reads as one
            block; a small gap separates them without changing their height. */}
        <div className="flex flex-col" style={{ gap: 3 }}>
        <NavItem href="/" label="ค้นหา" active={activeNav === "search"} strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        <NavItem href="/smart-picks" label="แนะนำอัจฉริยะ" active={activeNav === "recommend"} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        <NavItem href="/progress" label="ความก้าวหน้า" active={activeNav === "progress"} d="M3 3v18h18M7 15l4-4 3 3 5-6" />
        {/* ผู้ดูแล (admin only) */}
        {activeNav === "admin" && (
          <NavItem href="/admin" label="ผู้ดูแล" active d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125" />
        )}

        {/* Theme toggle */}
        <ThemeToggle />
        </div>
      </div>

      {/* Divider 2 */}
      <div style={{ height: 0.38, background: "var(--ku-divider)", flexShrink: 0, marginTop: 8 }} />

      {/* Recent Section */}
      <div
        className="flex items-center shrink-0"
        style={{ paddingLeft: 18.5 + 15, paddingRight: 18.5 + 3, paddingTop: 16, paddingBottom: 10 }}
      >
        {confirmingClear ? (
          <>
            {/* Confirmation replaces the header rather than opening a dialog, so the
                rail keeps its width and the list stays visible behind the choice. */}
            <p className="flex-1 text-[12px] leading-[16px]" style={{ color: "var(--ku-text-faint)" }}>ลบทั้งหมด?</p>
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              aria-label="ยืนยันลบประวัติทั้งหมด"
              className="text-[12px] hover:opacity-70 transition-opacity"
              style={{ background: "none", border: "none", padding: 0, cursor: clearing ? "wait" : "pointer", color: "#dc2626" }}
            >
              {clearing ? "..." : "ลบ"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingClear(false)}
              disabled={clearing}
              aria-label="ยกเลิก"
              className="text-[12px] hover:opacity-70 transition-opacity"
              style={{ background: "none", border: "none", padding: 0, marginLeft: 10, cursor: "pointer", color: "var(--ku-text-faint)" }}
            >
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <p className="flex-1 text-[12px] leading-[16px]" style={{ color: "var(--ku-text-faint)" }}>ล่าสุด</p>
            {user && recentSearches.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                aria-label="ลบประวัติการค้นหาทั้งหมด"
                title="ลบประวัติการค้นหาทั้งหมด"
                className="hover:opacity-70 transition-opacity"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--ku-text-faint)", lineHeight: 0,
                  // Padding rather than a bigger glyph: the icon stays proportional
                  // to the "+" beside it while the tap target reaches a usable size.
                  padding: 4, margin: "-4px 6px -4px -4px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path
                    d="M2.6 3.8h8.8M5.6 3.8V2.6h2.8v1.2M3.8 3.8l.5 7.2h5.4l.5-7.2M6 6.2v3M8 6.2v3"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <Link href="/" aria-label="ค้นหาใหม่" className="text-[12px] hover:opacity-70 transition-opacity" style={{ color: "var(--ku-text-faint)", textDecoration: "none" }}>+</Link>
          </>
        )}
      </div>

      {user ? (
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", paddingLeft: 18.5, paddingRight: 18.5 }}>
          {recentSearches.map((item) => (
            <Link
              key={item.id}
              href={`/learn?h=${item.id}`}
              title={item.query}
              className="flex w-full rounded-[9px] transition-all text-left hover:bg-[var(--ku-hover-bg)]"
              style={{ paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12, textDecoration: "none" }}
            >
              {/* Queries are free text, so clamp to the two lines the fixed 195px rail allows. */}
              <span
                className="text-[12px] leading-[16px]"
                style={{
                  color: "var(--ku-text-muted)", width: 128,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden", overflowWrap: "anywhere",
                }}
              >
                {item.query}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {!user && (
        <div style={{ padding: "0 18.5px 20px" }}>
          <div
            className="flex flex-col rounded-[21px]"
            style={{ border: "1px solid var(--ku-promo-border)", background: "var(--ku-promo-bg)", paddingLeft: 12, paddingRight: 12, paddingTop: 18, paddingBottom: 12, gap: 11 }}
          >
            <div className="text-center flex flex-col" style={{ gap: 4.5 }}>
              <p className="text-[12px] leading-[16px] font-medium" style={{ color: "var(--ku-text)" }}>เริ่มต้นกัน !</p>
              <p className="text-[12px] leading-[16px]" style={{ color: "var(--ku-text-muted)" }}>การค้นหาหรือ<br />จัดระเบียบงานวิจัย</p>
            </div>
            <button
              onClick={handleLogin}
              className="flex items-center justify-center font-medium text-[14px] leading-[20px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity"
              style={{ background: PRIMARY, boxShadow: "0px 3px 9px rgba(59,99,71,0.3)", height: 44, gap: 4.5 }}
            >
              <span>+</span><span>เข้าสู่ระบบ</span>
            </button>
            <Link
              href="/register"
              className="flex items-center justify-center font-medium text-[14px] leading-[20px] rounded-[9px] w-full hover:opacity-90 transition-opacity"
              style={{ border: "1px solid var(--ku-promo-secondary-border)", background: "transparent", color: "var(--ku-promo-secondary-text)", height: 44, textDecoration: "none" }}
            >
              ลงทะเบียน
            </Link>
          </div>
        </div>
      )}

      {user && (
        <div style={{ padding: "0 18.5px 20px" }}>
          <div
            className="flex flex-col rounded-[21px]"
            style={{ border: "1px solid var(--ku-promo-border)", background: "var(--ku-promo-bg)", paddingLeft: 12, paddingRight: 12, paddingTop: 18, paddingBottom: 12, gap: 11 }}
          >
            <div className="flex flex-col" style={{ gap: 4.5 }}>
              <p className="text-[12px] leading-[16px] font-medium" style={{ color: "var(--ku-text)" }}>เริ่มต้นกันเลย!</p>
              <p className="text-[12px] leading-[16px]" style={{ color: "var(--ku-text-muted)" }}>การค้นหาหรือ<br />จัดระเบียบงานวิจัย</p>
            </div>
            <Link
              href="/"
              className="flex items-center justify-center font-medium text-[14px] leading-[20px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity"
              style={{ background: PRIMARY, boxShadow: "0px 3px 9px rgba(59,99,71,0.3)", height: 44, gap: 4.5, textDecoration: "none" }}
            >
              <span>+</span><span>แชทใหม่</span>
            </Link>
            <button
              onClick={() => void logout()}
              className="text-[12px] leading-[16px] hover:opacity-70 transition-opacity text-center w-full"
              style={{ color: "var(--ku-text-faint)" }}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
