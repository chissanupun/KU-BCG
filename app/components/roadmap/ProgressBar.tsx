"use client";

/** Track is always rendered; the fill is omitted when the source has no progress signal. */
export default function ProgressBar({ progress, width = 375 }: { progress?: number; width?: number | string }) {
  const pct = Math.max(0, Math.min(100, progress ?? 0));

  return (
    <div style={{ width, maxWidth: "100%", height: 4, background: "var(--ku-progress-track)", borderRadius: 12 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "var(--ku-progress-fill)", borderRadius: 12 }} />
    </div>
  );
}
