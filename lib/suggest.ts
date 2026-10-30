export type SuggestKind = "topic" | "keyword" | "title" | "course";
export interface Suggestion { text: string; kind: SuggestKind }

export const normalize = (s: string) => s.normalize("NFC").toLowerCase().trim();

const KIND_ORDER: Record<SuggestKind, number> = { topic: 0, keyword: 1, course: 2, title: 3 };

/** 0 = starts with the query, 1 = a later word starts with it, 2 = appears inside (Thai has no spaces, so this matters). */
function rank(text: string, q: string): number {
  const at = text.indexOf(q);
  if (at < 0) return -1;
  if (at === 0) return 0;
  return /\s/.test(text[at - 1]) ? 1 : 2;
}

/** O(n) per keystroke; the index is a few thousand entries, so no prebuilt structure. */
export function suggest(index: Suggestion[], query: string, limit = 10): Suggestion[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const hits: { s: Suggestion; r: number; key: string }[] = [];
  for (const s of index) {
    const key = normalize(s.text);
    const r = rank(key, q);
    if (r >= 0) hits.push({ s, r, key });
  }
  hits.sort((a, b) => a.r - b.r || KIND_ORDER[a.s.kind] - KIND_ORDER[b.s.kind] || a.s.text.length - b.s.text.length);
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const h of hits) {
    if (seen.has(h.key)) continue;
    seen.add(h.key);
    out.push(h.s);
    if (out.length === limit) break;
  }
  return out;
}
