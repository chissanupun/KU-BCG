"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TABS, type TabKey } from "@/lib/resultView";
import { FONT, PRIMARY } from "../components/roadmap/tokens";

/** Tab state lives in `?tab=` so refresh and Back/Forward land on the same tab. */
export default function ResultTabs({ title, active }: { title: string; active: TabKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (key: TabKey) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <header style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: FONT, fontSize: 20, fontWeight: 600, lineHeight: "30px", color: "var(--ku-text)", overflowWrap: "anywhere" }}>
        {title}
      </h1>
      <div role="tablist" aria-label="โหมดการดูผลลัพธ์" className="flex flex-wrap" style={{ gap: 10, marginTop: 14 }}>
        {TABS.map((t) => {
          const selected = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`tab-${t.key}`}
              aria-selected={selected}
              aria-controls="result-panel"
              onClick={() => select(t.key)}
              style={{
                fontFamily: FONT, fontSize: 13, fontWeight: 600, height: 32, padding: "0 14px", borderRadius: 6,
                background: selected ? PRIMARY : "transparent", color: selected ? "#ffffff" : "var(--ku-text-muted)",
                border: selected ? "none" : "0.5px solid var(--ku-card-border)",
                boxShadow: selected ? "var(--ku-badge-shadow)" : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
