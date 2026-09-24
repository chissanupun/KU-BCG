"use client";

import { PRIMARY, FONT } from "./tokens";

/**
 * The one control that writes progress. Rendered on every roadmap card and once
 * on the topic detail page, so the two views stay visually and behaviourally
 * identical — a tick is a tick wherever it is clicked.
 */
export default function CompleteToggle({
  completed,
  onToggle,
  label,
  size = 22,
}: {
  completed: boolean;
  onToggle: () => void;
  /** Text right of the circle. Omitted on cards, where space is tight. */
  label?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={completed}
      title={completed ? "ทำเครื่องหมายว่ายังไม่จบ" : "ทำเครื่องหมายว่าเรียนจบแล้ว"}
      onClick={(e) => {
        // Cards wrap their body in a Link; a tick must not navigate.
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        fontFamily: FONT, fontSize: 13, lineHeight: "20px",
        color: completed ? PRIMARY : "var(--ku-text-muted)",
      }}
    >
      <span
        style={{
          width: size, height: size, borderRadius: "50%", flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: completed ? PRIMARY : "transparent",
          // The card border colour is near-invisible against the card itself, so an
          // untouched circle borrows the muted text colour to stay legible in both themes.
          border: completed ? `1.5px solid ${PRIMARY}` : "1.5px solid var(--ku-text-muted)",
          transition: "background 0.15s, border-color 0.15s",
        }}
      >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 12 12" fill="none" aria-hidden>
          <path
            d="M2.5 6.2L4.8 8.5L9.5 3.8"
            stroke={completed ? "#ffffff" : "var(--ku-text-muted)"}
            opacity={completed ? 1 : 0.5}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}
