import { AI_BADGE_TEXT, badgeTooltip } from "@/lib/aiTranslation";
import type { AiTranslation } from "@/lib/types";
import { FONT } from "./roadmap/tokens";

/** Marks text that an AI translated from an English original. Shown wherever such text is. */
export default function AiBadge({ translation }: { translation?: AiTranslation }) {
  return (
    <span
      title={badgeTooltip(translation)}
      data-testid="ai-badge"
      style={{
        display: "inline-block", fontFamily: FONT, fontSize: 11, lineHeight: "16px", color: "var(--ku-text-muted)",
        border: "0.5px dashed var(--ku-tag-border)", borderRadius: 6, padding: "1px 7px",
      }}
    >
      {AI_BADGE_TEXT}
    </span>
  );
}
