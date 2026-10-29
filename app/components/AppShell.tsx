"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import Image from "next/image";
import Sidebar from "./Sidebar";

/**
 * Gate 1.4.6: the sidebar is a fixed rail only from 1025px up, so 1024×768 (iPad
 * landscape, 1st-gen) and portrait widths get a header with a hamburger instead.
 * `min-[1025px]:` is the single breakpoint every page shares.
 *
 * Responsive padding/margin utilities need a trailing `!` in this repo: globals.css has an
 * unlayered `* { margin: 0; padding: 0 }` that otherwise beats Tailwind's layered utilities.
 */
export default function AppShell({
  activeNav,
  logo = true,
  children,
}: {
  activeNav?: ComponentProps<typeof Sidebar>["activeNav"];
  /** Desktop top-right logo. Off for pages that never had one and whose content runs under it. */
  logo?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus();
    const trigger = menuButton.current;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  return (
    <div className="flex h-dvh w-full overflow-hidden" style={{ background: "var(--ku-bg)" }}>
      <div className="hidden min-[1025px]:block shrink-0" inert={open}>
        <Sidebar height="100dvh" activeNav={activeNav} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col" inert={open}>
        <header
          className="flex min-[1025px]:hidden shrink-0 items-center justify-between"
          style={{ height: 56, padding: "0 16px", borderBottom: "0.5px solid var(--ku-sidebar-border)" }}
        >
          <button
            type="button"
            aria-label="เมนู"
            aria-expanded={open}
            aria-controls={open ? "mobile-nav" : undefined}
            ref={menuButton}
            onClick={() => setOpen(true)}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44, marginLeft: -8, color: "var(--ku-text)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Image src="/ku-bcg.png" alt="KU Phumpanya" width={40} height={38} className="object-contain ku-logo" unoptimized />
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {logo && (
            <div className="absolute hidden min-[1025px]:block" style={{ right: 32, top: 30, zIndex: 10 }}>
              <Image src="/ku-bcg.png" alt="KU Phumpanya" width={100} height={95} className="object-contain ku-logo" unoptimized />
            </div>
          )}
          {children}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 min-[1025px]:hidden"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => {
            // Backdrop tap or any link inside the drawer (e.g. a RECENTS row that stays on /learn).
            if (e.target === e.currentTarget || (e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <div id="mobile-nav" role="dialog" aria-modal="true" aria-label="เมนู" className="absolute inset-y-0 left-0 max-w-[85vw]">
            <Sidebar height="100%" activeNav={activeNav} />
            <button
              type="button"
              ref={closeButton}
              aria-label="ปิดเมนู"
              onClick={() => setOpen(false)}
              className="absolute flex items-center justify-center"
              style={{ top: 8, right: 8, width: 44, height: 44, color: "var(--ku-text-muted)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
