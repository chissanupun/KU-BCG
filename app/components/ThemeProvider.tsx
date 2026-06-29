"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setIsDark(current !== "light");
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ku-theme", next);
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center w-full rounded-[9px] transition-colors hover:bg-[var(--ku-hover-bg)]"
      style={{ gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 10, paddingBottom: 10, minHeight: 44 }}
      aria-label={isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"}
      suppressHydrationWarning
    >
      {isDark ? (
        <svg style={{ width: 16, height: 16, flexShrink: 0, color: "var(--ku-text-muted)" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg style={{ width: 16, height: 16, flexShrink: 0, color: "var(--ku-text-muted)" }} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
      <span className="text-[12px] leading-[16px]" style={{ color: "var(--ku-text-muted)" }} suppressHydrationWarning>
        {isDark ? "โหมดสว่าง" : "โหมดมืด"}
      </span>
    </button>
  );
}
