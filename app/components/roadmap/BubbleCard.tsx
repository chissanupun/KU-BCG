"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { RoadmapCard } from "@/lib/roadmap";
import { FONT, fadeIn } from "./tokens";
import CompleteToggle from "./CompleteToggle";

const hoverOn = (el: HTMLElement) => {
  el.style.borderColor = "rgba(59,99,71,0.6)";
  el.style.boxShadow = "0 0 24px rgba(59,99,71,0.15)";
};
const hoverOff = (el: HTMLElement, completed: boolean) => {
  el.style.borderColor = completed ? "rgba(59,99,71,0.55)" : "var(--ku-card-border)";
  el.style.boxShadow = "none";
};

const isUrl = (value: string) => /^https?:\/\//i.test(value.trim());

/**
 * Backend sends source URLs in `desc`. KU Forest links carry percent-encoded Thai
 * query strings hundreds of characters long, which stretched the card past the
 * viewport. Show the host (plus a short path hint) and keep the full URL in href.
 */
function linkLabel(url: string): string {
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, "");
    const segment = pathname.split("/").filter(Boolean).slice(0, 2).join("/");
    return segment ? `${host}/${segment}` : host;
  } catch {
    return url;
  }
}

export default function BubbleCard({
  card,
  delay,
  completed = false,
  onToggle,
}: {
  card: RoadmapCard;
  delay: number;
  completed?: boolean;
  /** Absent on the curated roadmap, which has no stored row to record progress against. */
  onToggle?: () => void;
}) {
  const inner = (
    <>
      <p
        style={{
          fontFamily: FONT, fontSize: 14, fontWeight: 600, lineHeight: "22px", color: "var(--ku-text)",
          // Keeps the title clear of the tick in the corner.
          paddingRight: onToggle ? 28 : 0,
        }}
      >
        {card.title}
      </p>
      {card.hours && (
        <p style={{ fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)", marginTop: 6 }}>
          {card.hours}
        </p>
      )}
      {card.description && (
        <p
          style={{
            fontFamily: FONT, fontSize: 13, lineHeight: "20px", color: "var(--ku-text-muted)",
            marginTop: 2, overflowWrap: "anywhere",
          }}
        >
          {isUrl(card.description) ? (
            // Can't be an <a>: the card itself is wrapped in a Link when card.href is
            // set, and nested <a> tags are invalid HTML (React hydration error).
            <span
              role="link"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                window.open(card.description, "_blank", "noopener,noreferrer");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(card.description, "_blank", "noopener,noreferrer");
                }
              }}
              title={card.description}
              style={{ color: "var(--ku-text-muted)", textDecoration: "underline", cursor: "pointer" }}
            >
              {linkLabel(card.description)}
            </span>
          ) : (
            card.description
          )}
        </p>
      )}
    </>
  );

  const style = {
    width: 250, minHeight: 150,
    background: "var(--ku-card-bg)",
    // A completed card keeps its shape and only shifts its border to the brand
    // green, so a finished phase reads at a glance without a second treatment.
    border: `0.5px solid ${completed ? "rgba(59,99,71,0.55)" : "var(--ku-card-border)"}`,
    borderRadius: 10, padding: "18px 20px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    position: "relative" as const,
  };

  const wrapperStyle = { display: "block", width: "100%", height: "100%", textDecoration: "none" } as const;

  const motionProps = {
    ...fadeIn(delay),
    whileHover: { scale: 1.02, transition: { duration: 0.15 } },
    whileTap: { scale: 0.97, transition: { duration: 0.1 } },
  };

  return (
    <motion.div
      style={style}
      {...motionProps}
      onMouseEnter={(e) => hoverOn(e.currentTarget as HTMLElement)}
      onMouseLeave={(e) => hoverOff(e.currentTarget as HTMLElement, completed)}
    >
      {onToggle && (
        <div style={{ position: "absolute", top: 14, right: 14, zIndex: 1, lineHeight: 0 }}>
          <CompleteToggle completed={completed} onToggle={onToggle} size={20} />
        </div>
      )}
      {card.href ? (
        <Link href={card.href} style={wrapperStyle}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </motion.div>
  );
}
