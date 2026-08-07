"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";

const FONT = "Poppins, sans-serif";

export default function AppShell({
  children,
  activeNav = "search",
  breadcrumb,
  showLogo = true,
}: {
  children: ReactNode;
  activeNav?: "search" | "recommend" | "admin";
  breadcrumb?: string;
  showLogo?: boolean;
}) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--ku-bg)", fontFamily: FONT }}
    >
      <Sidebar activeNav={activeNav} />

      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ background: "var(--ku-surface, var(--ku-bg))" }}
      >
        <header
          className="shrink-0 flex items-center justify-between"
          style={{
            padding: "16px 28px",
            borderBottom: "0.5px solid var(--ku-sidebar-border)",
            minHeight: 56,
          }}
        >
          <p
            className="text-[13px] leading-[20px] truncate"
            style={{ color: "var(--ku-text-faint)" }}
          >
            {breadcrumb ?? "หน้าแรก"}
          </p>
          {showLogo && (
            <Image
              src="/ku-bcg.png"
              alt="KU Phumpanya"
              width={48}
              height={52}
              className="object-contain ku-logo"
              unoptimized
            />
          )}
        </header>

        <main className="flex-1 overflow-y-auto min-h-0">{children}</main>
      </div>
    </div>
  );
}
