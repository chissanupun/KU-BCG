"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWordcloud } from "@visx/wordcloud";
import type { KnowledgeGraph } from "@/lib/types";
import { cloudWords } from "@/lib/wordCloud";
import { FONT } from "../components/roadmap/tokens";

const WIDTH = 900;
const HEIGHT = 540;
const MIN_SIZE = 14;
const MAX_SIZE = 120;
// Mid-tone greens, olive and ochre: readable on both the light and the dark card.
const PALETTE = ["#3F7A2E", "#6B8F1F", "#8DA82B", "#A0652D", "#B7791F", "#4A7A4F", "#7A5A2E"];

/** Small seeded PRNG: scattered start points, but the same graph always lays out the same way. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The ideas on the map as a word cloud: bigger = connected to more of the map. */
export default function WordCloudTab({ graph }: { graph?: KnowledgeGraph }) {
  const words = useMemo(() => cloudWords(graph), [graph]);
  // d3-cloud measures text on a canvas; measuring before the fonts load packs the words for the wrong widths.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    let live = true;
    (document.fonts?.ready ?? Promise.resolve()).then(() => live && setFontsReady(true));
    return () => { live = false; };
  }, []);

  // useWordcloud re-lays out whenever fontSize or rotate changes identity, and every layout sets state:
  // fresh functions each render would make the cloud re-pack forever. Keep both stable.
  const fontSize = useMemo(() => {
    const values = words.map((w) => w.value);
    const [lo, hi] = [Math.min(...values), Math.max(...values)];
    // Exponent below 1 keeps one hub from shrinking everything else to the minimum, yet leaves the top word clearly dominant.
    return (w: { value: number }) => (hi === lo ? 36 : MIN_SIZE + ((w.value - lo) / (hi - lo)) ** 0.7 * (MAX_SIZE - MIN_SIZE));
  }, [words]);
  const rotate = useCallback((_w: unknown, i: number) => (i % 4 === 3 ? -90 : 0), []); // about one word in four stands upright, as in a classic cloud
  const random = useMemo(() => seeded(words.length), [words.length]);
  // Zero width/height makes the hook skip the layout, which is how we hold it back until the fonts are in.
  const placed = useWordcloud({
    words,
    width: fontsReady ? WIDTH : 0,
    height: fontsReady ? HEIGHT : 0,
    font: FONT,
    fontSize,
    fontWeight: 700,
    padding: 1,
    rotate,
    random,
  });

  if (words.length === 0) {
    return <p style={{ fontFamily: FONT, fontSize: 13, color: "var(--ku-text-muted)" }}>ยังไม่มีคำสำคัญสำหรับคำค้นนี้</p>;
  }


  return (
    <div>
      <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "21px", color: "var(--ku-text-muted)", marginBottom: 12 }}>
        คำที่ใหญ่กว่าคือหัวข้อที่เชื่อมกับส่วนอื่นของแผนที่มากกว่า (แสดง {words.length} คำแรก)
      </p>
      <div style={{ borderRadius: 20, border: "0.5px solid var(--ku-card-border)", background: "var(--ku-card-bg)", padding: 12 }}>
        <svg role="img" aria-label="กลุ่มคำสำคัญของหัวข้อนี้" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: "100%", height: "auto", display: "block" }}>
          <g transform={`translate(${WIDTH / 2}, ${HEIGHT / 2})`}>
            {placed.map((w, i) => (
              <text
                key={w.text}
                textAnchor="middle"
                transform={`translate(${w.x ?? 0}, ${w.y ?? 0}) rotate(${w.rotate ?? 0})`}
                fontSize={w.size}
                fontFamily={FONT}
                fontWeight={700}
                fill={PALETTE[i % PALETTE.length]}
              >
                {w.text}
              </text>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
