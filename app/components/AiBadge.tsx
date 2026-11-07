import { AI_BADGE_TEXT, badgeTooltip } from "@/lib/aiTranslation";
import type { AiTranslation } from "@/lib/types";
import { FONT } from "./roadmap/tokens";

/**
 * Marks anything an AI produced, so nobody takes it for verified source text. Deliberately loud: a filled
 * violet chip with a spark icon, a colour the rest of the app does not use. `text` defaults to the
 * translation wording; other AI content passes its own.
 */
export default function AiBadge({
  translation, text = AI_BADGE_TEXT, testId = "ai-badge", title,
}: { translation?: AiTranslation; text?: string; testId?: string; title?: string }) {
  return (
    <span
      title={title ?? badgeTooltip(translation)}
      data-testid={testId}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONT, fontSize: 12, fontWeight: 600, lineHeight: "18px",
        color: "var(--ku-ai-text)", background: "var(--ku-ai-bg)", border: "1px solid var(--ku-ai-border)",
        borderRadius: 6, padding: "1px 8px", verticalAlign: "middle",
      }}
    >
      <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.2 6.3L21 10l-5.2 3.9L17.5 21 12 17.2 6.5 21l1.7-7.1L3 10l6.8-1.7z" /></svg>
      {text}
    </span>
  );
}
