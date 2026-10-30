/** Fields the KUKR search API returns per record; the Thai and English forms come separately. */
export interface KukrLangSource {
  title_th?: string;
  title_en?: string;
  abstract_th?: string;
  abstract_en?: string;
}

/** The four index fields that hold KUKR text. `*_en` keeps the English form so English queries still match. */
export interface KukrLang {
  title: string;
  title_en?: string;
  abstract?: string;
  abstract_en?: string;
}

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

/** Rule 1: Thai-dominant. A "Microplastics" inside a Thai sentence still counts as Thai. */
export function isThai(text?: string): boolean {
  if (!text) return false;
  const th = count(text, /[฀-๿]/g);
  const latin = count(text, /[A-Za-z]/g);
  return th > 0 && th / (th + latin) > 0.3;
}

const clean = (s?: string) => (typeof s === 'string' ? s.trim() : '') || undefined;

/** Thai form wins for display (rules 2 and 3); the English form is always filed under `*_en` when it exists. */
function pair(th?: string, en?: string): { shown?: string; en?: string } {
  const thai = clean(th);
  const english = clean(en);
  const realThai = [thai, english].find((t) => t && isThai(t)); // fields can arrive swapped
  const realEnglish = [english, thai].find((t) => t && !isThai(t));
  return { shown: realThai ?? realEnglish ?? clean(th) ?? clean(en), en: realEnglish };
}

export function pickLang(item: KukrLangSource, fallbackTitle = 'Untitled'): KukrLang {
  const t = pair(item.title_th, item.title_en);
  const a = pair(item.abstract_th, item.abstract_en);
  const out: KukrLang = { title: t.shown ?? fallbackTitle };
  // title_en only when it differs from what is shown (English-only records have nothing to duplicate).
  if (t.en && t.en !== out.title) out.title_en = t.en;
  if (a.shown) out.abstract = a.shown;
  if (a.en && a.en !== out.abstract) out.abstract_en = a.en;
  return out;
}

/** Rules 4 and 5: Thai is never replaced by English; fields the fresh record lacks keep their current value. */
export function mergeLang(existing: Partial<KukrLang>, fresh: Partial<KukrLang>): Partial<KukrLang> {
  const keepThai = (cur?: string, next?: string) => (next && (isThai(next) || !isThai(cur)) ? next : cur);
  // Old scrapes kept English under `title`/`abstract`; when Thai replaces it, that English moves to `*_en`.
  const demoted = (cur?: string, now?: string) => (cur && cur !== now && !isThai(cur) ? cur : undefined);
  const title = keepThai(existing.title, fresh.title);
  const abstract = keepThai(existing.abstract, fresh.abstract);
  const merged: Partial<KukrLang> = {
    title,
    title_en: fresh.title_en ?? existing.title_en ?? demoted(existing.title, title),
    abstract,
    abstract_en: fresh.abstract_en ?? existing.abstract_en ?? demoted(existing.abstract, abstract),
  };
  return Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== undefined));
}
