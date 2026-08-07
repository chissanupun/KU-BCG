"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeProvider";
import { useUser } from "@/lib/UserContext";
import { useSearchHistory } from "@/lib/SearchHistoryContext";
import { apiFetch, googleLoginUrl } from "@/lib/api";

const PRIMARY = "#3b6347";
const WIDTH = 248;

function NavRow({
  href,
  active,
  label,
  children,
}: {
  href: string;
  active: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} style={{ display: "block", textDecoration: "none" }}>
      <div
        className="flex items-center w-full rounded-[10px] transition-all hover:bg-[var(--ku-hover-bg)]"
        style={{
          gap: 12,
          padding: "10px 12px",
          minHeight: 42,
          ...(active
            ? {
                background: "var(--ku-nav-active-bg)",
                border: "0.5px solid var(--ku-nav-active-border)",
              }
            : { border: "0.5px solid transparent" }),
        }}
      >
        {children}
        <span
          className="flex-1 text-[13px] leading-[18px] text-left"
          style={{
            color: active ? "var(--ku-text)" : "var(--ku-text-muted)",
            fontWeight: active ? 500 : 400,
          }}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function Sidebar({
  activeNav = "search",
}: {
  /** @deprecated height ignored — sidebar is always full viewport */
  height?: number | string;
  activeNav?: "search" | "recommend" | "admin";
}) {
  const { user, refetch } = useUser();
  const { items: recentSearches } = useSearchHistory();

  const [avatarFailed, setAvatarFailed] = useState(false);
  useEffect(() => setAvatarFailed(false), [user?.avatar_url]);
  const showAvatar = Boolean(user?.avatar_url) && !avatarFailed;

  const handleLogin = () => {
    window.location.href = googleLoginUrl();
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/logout", { method: "POST" });
    } catch {
      // best effort
    } finally {
      await refetch();
    }
  };

  return (
    <aside
      className="flex flex-col shrink-0 h-full"
      style={{
        width: WIDTH,
        background: "var(--ku-bg)",
        borderRight: "0.5px solid var(--ku-sidebar-border)",
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center shrink-0"
        style={{ padding: "20px 18px 12px", gap: 10 }}
      >
        <Image
          src="/ku-bcg.png"
          alt=""
          width={32}
          height={35}
          className="object-contain ku-logo"
          unoptimized
        />
        <div className="min-w-0">
          <p
            className="text-[13px] font-medium leading-[18px] truncate"
            style={{ color: "var(--ku-text)" }}
          >
            Phumpanya
          </p>
          <p
            className="text-[11px] leading-[14px] truncate"
            style={{ color: "var(--ku-text-faint)" }}
          >
            KU BCG
          </p>
        </div>
      </div>

      {/* New search CTA */}
      <div style={{ padding: "4px 14px 12px" }}>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 w-full rounded-[10px] text-[13px] font-medium hover:opacity-90 transition-opacity"
          style={{
            height: 40,
            background: PRIMARY,
            color: "#fff",
            textDecoration: "none",
            boxShadow: "0px 2px 8px rgba(59,99,71,0.25)",
          }}
        >
          <span>+</span>
          <span>ค้นหาใหม่</span>
        </Link>
      </div>

      {/* Profile */}
      <div
        className="flex items-center shrink-0"
        aria-label="โปรไฟล์ผู้ใช้"
        style={{ padding: "8px 18px 14px", gap: 10 }}
      >
        <div
          className="rounded-full flex items-center justify-center overflow-hidden shrink-0"
          style={{
            width: 36,
            height: 36,
            background: "var(--ku-avatar-bg)",
            border: "0.5px solid var(--ku-avatar-border)",
          }}
        >
          {showAvatar ? (
            <img
              src={user!.avatar_url!}
              width={36}
              height={36}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
              style={{ display: "block", maxWidth: "100%" }}
              alt=""
            />
          ) : (
            <svg
              style={{ width: 16, height: 16, color: "var(--ku-text-muted)" }}
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
          <p
            className="text-[12px] leading-[16px] truncate"
            style={{ color: "var(--ku-text-faint)" }}
          >
            แผนฟรี
          </p>
          <p
            className="text-[12px] leading-[16px] truncate"
            style={{ color: "var(--ku-text)" }}
          >
            {user?.name || "ผู้เยี่ยมชม"}
          </p>
        </div>
      </div>

      <div style={{ height: 0.5, background: "var(--ku-divider)", flexShrink: 0 }} />

      {/* Nav */}
      <div className="shrink-0" style={{ padding: "12px 14px" }}>
        <p
          className="text-[11px] leading-[14px] mb-2"
          style={{ color: "var(--ku-text-faint)", paddingLeft: 8 }}
        >
          นำทาง
        </p>

        <NavRow href="/" active={activeNav === "search"} label="ค้นหา">
          <svg
            style={{ width: 16, height: 16, flexShrink: 0 }}
            fill="none"
            stroke={
              activeNav === "search"
                ? "var(--ku-icon-active)"
                : "var(--ku-text-muted)"
            }
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
        </NavRow>

        <NavRow
          href="/smart-picks"
          active={activeNav === "recommend"}
          label="แนะนำอัจฉริยะ"
        >
          <svg
            style={{ width: 16, height: 16, flexShrink: 0 }}
            fill="none"
            stroke={
              activeNav === "recommend"
                ? "var(--ku-icon-active)"
                : "var(--ku-text-muted)"
            }
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
        </NavRow>

        {activeNav === "admin" && (
          <NavRow href="/admin" active label="ผู้ดูแล">
            <svg
              style={{ width: 16, height: 16, flexShrink: 0 }}
              fill="none"
              stroke="var(--ku-icon-active)"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125"
              />
            </svg>
          </NavRow>
        )}

        <div style={{ marginTop: 4 }}>
          <ThemeToggle />
        </div>
      </div>

      <div style={{ height: 0.5, background: "var(--ku-divider)", flexShrink: 0 }} />

      {/* Recent */}
      <div
        className="flex items-center shrink-0"
        style={{ padding: "12px 18px 8px" }}
      >
        <p
          className="flex-1 text-[11px] leading-[14px]"
          style={{ color: "var(--ku-text-faint)" }}
        >
          ล่าสุด
        </p>
      </div>

      {user ? (
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            padding: "0 14px",
          }}
        >
          {recentSearches.map((item) => (
            <Link
              key={item.id}
              href={`/learn?h=${item.id}`}
              title={item.query}
              className="flex w-full rounded-[10px] transition-all text-left hover:bg-[var(--ku-hover-bg)]"
              style={{
                padding: "10px 12px",
                textDecoration: "none",
              }}
            >
              <span
                className="text-[12px] leading-[16px]"
                style={{
                  color: "var(--ku-text-muted)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  overflowWrap: "anywhere",
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

      {/* Footer CTA */}
      <div style={{ padding: "12px 14px 18px" }}>
        {!user ? (
          <div
            className="flex flex-col rounded-[16px]"
            style={{
              border: "1px solid var(--ku-promo-border)",
              background: "var(--ku-promo-bg)",
              padding: "14px 12px",
              gap: 10,
            }}
          >
            <p
              className="text-[12px] leading-[16px] font-medium text-center"
              style={{ color: "var(--ku-text)" }}
            >
              เริ่มต้นกัน !
            </p>
            <button
              onClick={handleLogin}
              className="flex items-center justify-center font-medium text-[13px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity"
              style={{
                background: PRIMARY,
                height: 40,
                boxShadow: "0px 3px 9px rgba(59,99,71,0.3)",
              }}
            >
              เข้าสู่ระบบ
            </button>
            <Link
              href="/register"
              className="flex items-center justify-center font-medium text-[13px] rounded-[9px] w-full hover:opacity-90 transition-opacity"
              style={{
                border: "1px solid var(--ku-promo-secondary-border)",
                color: "var(--ku-promo-secondary-text)",
                height: 40,
                textDecoration: "none",
              }}
            >
              ลงทะเบียน
            </Link>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="text-[12px] leading-[16px] hover:opacity-70 transition-opacity text-center w-full"
            style={{ color: "var(--ku-text-faint)" }}
          >
            ออกจากระบบ
          </button>
        )}
      </div>
    </aside>
  );
}
