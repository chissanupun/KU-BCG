"use client";

import { useId, useMemo, useState } from "react";
import { suggest, type SuggestKind, type Suggestion } from "@/lib/suggest";

const KIND_LABEL: Record<SuggestKind, string> = { topic: "หัวข้อ", keyword: "คำสำคัญ", title: "งานวิจัย", course: "คอร์ส" };

type Props = { value: string; onChange: (v: string) => void; onSubmit: (text: string) => void };

/** The home page's search input with a type-ahead list (combobox pattern). Must sit in a `relative` parent: the list is absolute. */
export default function SuggestBox({ value, onChange, onSubmit }: Props) {
  const id = useId();
  const [index, setIndex] = useState<Suggestion[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = useMemo(() => (index ? suggest(index, value) : []), [index, value]);
  const expanded = open && items.length > 0;

  const load = () => {
    if (index) return;
    // The list is ~280 KB, so it is fetched on first focus instead of shipping with the page.
    import("@/lib/suggestions.json").then((m) => setIndex(m.default as Suggestion[])).catch(() => setIndex([]));
  };

  const pick = (text: string) => {
    setOpen(false);
    onChange(text);
    onSubmit(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (items.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      // -1 (nothing highlighted) is a stop in the cycle, so ArrowUp from the first item returns to the typed text
      setActive((a) => ((a + 1 + step + items.length + 1) % (items.length + 1)) - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (expanded && active >= 0) pick(items[active].text);
      else onSubmit(value);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <>
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={load}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="วันนี้อยากสำรวจเรื่องอะไร?"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        className="search-input min-w-0 flex-1 outline-none bg-transparent text-[16px]"
        style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 14, paddingBottom: 14, color: "var(--ku-text)" }}
      />
      {expanded && (
        <ul
          id={`${id}-list`}
          role="listbox"
          style={{
            position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, zIndex: 20, maxHeight: 360, overflowY: "auto",
            background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)", borderRadius: 8,
            boxShadow: "var(--ku-search-shadow)", listStyle: "none", padding: 4,
          }}
        >
          {items.map((s, i) => (
            <li
              key={`${s.kind}-${s.text}`}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: the input's blur would close the list before a click lands
              onMouseDown={(e) => { e.preventDefault(); pick(s.text); }}
              onMouseEnter={() => setActive(i)}
              className="flex items-center justify-between"
              style={{ gap: 12, padding: "8px 12px", borderRadius: 6, cursor: "pointer", fontSize: 15, color: "var(--ku-text)", background: i === active ? "var(--ku-tag-bg)" : "transparent" }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.text}</span>
              <span style={{ flexShrink: 0, fontSize: 12, color: "var(--ku-text-muted)" }}>{KIND_LABEL[s.kind]}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
