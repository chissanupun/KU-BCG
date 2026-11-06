/** AI Thai translations of English-only text: which fields get one, and the automatic checks on a translation. */
import crypto from 'crypto';

export interface Cache { [sha256: string]: { field: string; src: string; th: string; model: string } }
export interface AiMeta { model: string; prompt_version: string; translated_at: string; source_lang: 'en'; fields: string[]; reviewed: false }
export interface DocLike { title?: string; abstract?: string; keywords?: string[] }
export interface DocPatch { title_ai_th?: string; abstract_ai_th?: string; keywords_ai_th?: string[]; ai_translation?: AiMeta }
export interface RelationPatch { subject_th?: string; object_th?: string; ai_translation?: AiMeta }

export const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
export const hasThai = (s: string) => /[ก-๙]/.test(s);

/** Only text with no Thai at all is translated; anything already Thai is left alone and never badged. */
const lookup = (text: string | undefined, cache: Cache) => (text && !hasThai(text) ? cache[sha(text)]?.th : undefined);

export function buildDocPatch(doc: DocLike, cache: Cache, meta: Omit<AiMeta, 'fields'>): DocPatch | null {
  const patch: DocPatch = {};
  const fields: string[] = [];
  const title = lookup(doc.title, cache);
  if (title) { patch.title_ai_th = title; fields.push('title'); }
  const abstract = lookup(doc.abstract, cache);
  if (abstract) { patch.abstract_ai_th = abstract; fields.push('abstract'); }
  const keywords = doc.keywords ?? [];
  const translated = keywords.map((k) => lookup(k, cache));
  if (translated.some(Boolean)) {
    // Same length and order as `keywords`; a keyword with no translation keeps its own text.
    patch.keywords_ai_th = keywords.map((k, i) => translated[i] ?? k);
    fields.push('keywords');
  }
  return fields.length ? { ...patch, ai_translation: { ...meta, fields } } : null;
}

export function buildRelationPatch(rel: { subject: string; object: string }, cache: Cache, meta: Omit<AiMeta, 'fields'>): RelationPatch | null {
  const subject = lookup(rel.subject, cache);
  const object = lookup(rel.object, cache);
  if (!subject && !object) return null;
  return {
    ...(subject && { subject_th: subject }), ...(object && { object_th: object }),
    ai_translation: { ...meta, fields: [subject && 'subject', object && 'object'].filter(Boolean) as string[] },
  };
}

/**
 * `hard` problems mean the translation is unusable (empty, or a number from the source is missing).
 * `soft` ones are usually fine (a Thai name followed by a Latin binomial, a short acronym) but a person should look.
 */
export function checkTranslation(src: string, th: string): { hard: string[]; soft: string[] } {
  const hard: string[] = [];
  const soft: string[] = [];
  if (!th.trim()) hard.push('empty');
  for (const n of src.match(/\d+(?:\.\d+)?/g) ?? []) if (!th.includes(n)) { hard.push(`number ${n} missing`); break; }
  const letters = th.replace(/[^A-Za-zก-๙]/g, '');
  const thai = (th.match(/[ก-๙]/g) ?? []).length;
  if (letters && thai / letters.length < 0.5) soft.push('under 50% Thai letters');
  if (th.length > 3 * src.length) soft.push('over 3x the source length');
  if (/(?:^|[^A-Za-z(])(?:[A-Za-z]+[ ]+){3}[A-Za-z]+(?![^(]*\))/.test(th.replace(/\([^)]*\)/g, ''))) soft.push('4+ English words outside parentheses');
  return { hard, soft };
}
