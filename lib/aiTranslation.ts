import type { AiTranslation } from "./types";

export const AI_BADGE_TEXT = "แปลโดย AI · ต้นฉบับเป็นภาษาอังกฤษ";

const THAI = /[ก-๙]/;

/** Hover text for the badge: which model translated it, and when. */
export function badgeTooltip(t?: AiTranslation): string | undefined {
  if (!t?.model) return undefined;
  const date = t.translated_at?.slice(0, 10);
  return `แปลโดย ${t.model}${date ? ` เมื่อ ${date}` : ""}`;
}

/**
 * The Thai translation replaces the original only when the original has no Thai of its own, so text that
 * was already Thai is never shown as machine-translated. `original` is set exactly when a translation is shown.
 */
export function shownText(original: string, ai?: string): { text: string; original?: string } {
  const translated = ai?.trim();
  return translated && !THAI.test(original) ? { text: translated, original } : { text: original };
}

/** Keyword tags, translated one by one under the same rule. The arrays must line up, else nothing is translated. */
export function shownKeywords(keywords: string[], ai?: string[]): { tags: string[]; translated: boolean } {
  if (!ai || ai.length !== keywords.length) return { tags: keywords, translated: false };
  const tags = keywords.map((k, i) => shownText(k, ai[i]).text);
  return { tags, translated: tags.some((t, i) => t !== keywords[i]) };
}
