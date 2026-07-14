"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeProvider";
import { useUser } from "@/lib/UserContext";
import { apiFetch, googleLoginUrl } from "@/lib/api";

const PRIMARY = "#3b6347";

export default function Sidebar({
  height = "100%",
  activeNav = "search",
}: {
  height?: number | string;
  activeNav?: "search" | "recommend" | "admin";
}) {
  const { user, refetch } = useUser();

  const handleLogin = () => {
    window.location.href = googleLoginUrl();
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // best effort — Laravel /logout is SSR-only today, response may not be JSON
    } finally {
      await refetch();
    }
  };

  return (
    <aside
      className="flex flex-col shrink-0"
      style={{ width: 195, height, background: "var(--ku-bg)", borderRight: "0.5px solid var(--ku-sidebar-border)" }}
    >
      {/* User Profile */}
      <div
        className="flex items-center shrink-0"
        aria-label="โปรไฟล์ผู้ใช้"
        style={{ paddingLeft: 18.5, paddingTop: 50, paddingBottom: 14, paddingRight: 18.5, gap: 9 }}
      >
        <div
          className="rounded-full flex items-center justify-center overflow-hidden shrink-0"
          style={{ width: 36.5, height: 36.5, background: "var(--ku-avatar-bg)", border: "0.5px solid var(--ku-avatar-border)" }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} className="w-full h-full object-cover" alt="avatar" />
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
      </div>

      {/* Divider 1 */}
      <div style={{ height: 0.38, background: "var(--ku-divider)", flexShrink: 0 }} />

      {/* Main Nav */}
      <div className="shrink-0" style={{ paddingLeft: 18.5, paddingRight: 18.5, paddingTop: 12 }}>
        <p className="text-[12px] leading-[16px] mb-[7px]" style={{ color: "var(--ku-text-faint)", paddingLeft: 15 }}>หลัก</p>

        {/* ค้นหา */}
        <Link href="/" style={{ display: "block", textDecoration: "none" }}>
          <div
            className="flex items-center w-full rounded-[9px] transition-all relative overflow-hidden hover:bg-[var(--ku-hover-bg)]"
            style={{
              gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12, minHeight: 44,
              ...(activeNav === "search"
                ? { background: "var(--ku-nav-active-bg)", border: "0.38px solid var(--ku-nav-active-border)" }
                : { border: "0.38px solid transparent" }),
            }}
          >
            <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke={activeNav === "search" ? "var(--ku-icon-active)" : "var(--ku-text-muted)"} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <span className="flex-1 text-[12px] leading-[16px] text-left" style={{ color: activeNav === "search" ? "var(--ku-text)" : "var(--ku-text-muted)", fontWeight: activeNav === "search" ? 500 : 400 }}>ค้นหา</span>
            {activeNav === "search" && (
              <svg style={{ width: 16, height: 16, flexShrink: 0, color: "var(--ku-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </Link>

        {/* แนะนำอัจฉริยะ */}
        <Link href="/smart-picks" style={{ display: "block", textDecoration: "none" }}>
          <div
            className="flex items-center w-full rounded-[9px] transition-all relative overflow-hidden hover:bg-[var(--ku-hover-bg)]"
            style={{
              gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12, minHeight: 44,
              ...(activeNav === "recommend"
                ? { background: "var(--ku-nav-active-bg)", border: "0.38px solid var(--ku-nav-active-border)" }
                : { border: "0.38px solid transparent" }),
            }}
          >
            <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke={activeNav === "recommend" ? "var(--ku-icon-active)" : "var(--ku-text-muted)"} strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-[12px] leading-[16px]" style={{ color: activeNav === "recommend" ? "var(--ku-text)" : "var(--ku-text-muted)", fontWeight: activeNav === "recommend" ? 500 : 400 }}>แนะนำอัจฉริยะ</span>
            {activeNav === "recommend" && (
              <svg style={{ width: 16, height: 16, flexShrink: 0, color: "var(--ku-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        </Link>

        {/* ผู้ดูแล (admin only) */}
        {activeNav === "admin" && (
          <Link href="/admin" style={{ display: "block", textDecoration: "none" }}>
            <div
              className="flex items-center w-full rounded-[9px] transition-all relative overflow-hidden"
              style={{
                gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12, minHeight: 44,
                background: "var(--ku-nav-active-bg)", border: "0.38px solid var(--ku-nav-active-border)",
              }}
            >
              <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="var(--ku-icon-active)" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125" />
              </svg>
              <span className="flex-1 text-[12px] leading-[16px] text-left" style={{ color: "var(--ku-text)", fontWeight: 500 }}>ผู้ดูแล</span>
              <svg style={{ width: 16, height: 16, flexShrink: 0, color: "var(--ku-text-faint)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        )}

        {/* Theme toggle */}
        <ThemeToggle />
      </div>

      {/* Divider 2 */}
      <div style={{ height: 0.38, background: "var(--ku-divider)", flexShrink: 0, marginTop: 4 }} />

      {/* Recent Section */}
      <div
        className="flex items-center shrink-0"
        style={{ paddingLeft: 18.5 + 15, paddingRight: 18.5 + 3, paddingTop: 12, paddingBottom: 12 }}
      >
        <p className="flex-1 text-[12px] leading-[16px]" style={{ color: "var(--ku-text-faint)" }}>ล่าสุด</p>
        <span className="text-[12px]" style={{ color: "var(--ku-text-faint)" }}>+</span>
      </div>

      {user && (
        <div className="shrink-0" style={{ paddingLeft: 18.5, paddingRight: 18.5 }}>
          {[
            "สำรวจบทความ\nคอมพิวเตอร์ควอนตัม",
            "สรุปการเปลี่ยนแปลง\nสภาพภูมิอากาศ 2024",
            "ผลการวิจัยสำคัญ\nด้านโครงข่ายประสาท",
          ].map((item, i) => (
            <button
              key={i}
              className="flex w-full rounded-[9px] transition-all text-left hover:bg-[var(--ku-hover-bg)]"
              style={{ paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12 }}
            >
              <span className="text-[12px] leading-[16px] whitespace-pre-line" style={{ color: "var(--ku-text-muted)", width: 128 }}>{item}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1" />

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
            <button
              className="flex items-center justify-center font-medium text-[14px] leading-[20px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity"
              style={{ background: PRIMARY, boxShadow: "0px 3px 9px rgba(59,99,71,0.3)", height: 44, gap: 4.5 }}
            >
              <span>+</span><span>แชทใหม่</span>
            </button>
            <button
              onClick={handleLogout}
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
