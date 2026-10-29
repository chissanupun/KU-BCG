/**
 * Builds lib/suggestions.json (the search box's type-ahead list) from the data/ snapshot and the six topics.
 *
 *   npm run suggest:gen
 *
 * Re-run whenever data/all_docs.json changes (after es:non-degree, patch-kukr-lang, a re-scrape): the list is a
 * snapshot, not a live query, so a stale list can offer a phrase that the index no longer matches.
 */
import fs from 'fs';
import path from 'path';
import type { Suggestion } from '../lib/suggest';

const MAX_BYTES = 400 * 1024;
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

type Src = { source: string; title?: string; title_en?: string; keywords?: string[] };
const docs: Src[] = read('data/all_docs.json').hits.hits.map((h: { _source: Src }) => h._source);
const topics: { name_th: string }[] = read('seed-data.json').topics;

const out = new Map<string, Suggestion>(); // first writer wins, so higher-priority kinds go in first
const add = (text: string | undefined, kind: Suggestion['kind']) => {
  const t = text?.replace(/\s+/g, ' ').trim();
  if (t && !out.has(t.toLowerCase())) out.set(t.toLowerCase(), { text: t, kind });
};

for (const t of topics) add(t.name_th, 'topic');

const counts = new Map<string, number>();
for (const d of docs) for (const k of new Set((d.keywords ?? []).map((k) => k.trim().toLowerCase()))) counts.set(k, (counts.get(k) ?? 0) + 1);
// Too generic to be a useful query on their own.
const GENERIC = new Set(['article', 'species', 'yields', 'thailand', 'ชนิด', 'ประเทศไทย']);
const usable = (k: string) => k.length >= 3 && k.length <= 40 && /[\p{L}]/u.test(k) && !GENERIC.has(k);
const display = new Map<string, string>(); // keep the original casing of a keyword
for (const d of docs) for (const k of d.keywords ?? []) display.set(k.trim().toLowerCase(), k.trim());
for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1])) if (n >= 2 && usable(k)) add(display.get(k), 'keyword');

for (const d of docs) if (d.source === 'KU_MOOC' || d.source === 'KU_NonDegree') add(d.title, 'course');
for (const d of docs) if (d.source === 'KUKR' || d.source === 'KU_Forest') { add(d.title, 'title'); add(d.title_en, 'title'); }

const list = [...out.values()];
const json = JSON.stringify(list);
if (Buffer.byteLength(json) > MAX_BYTES) { console.error(`suggestions.json is ${Buffer.byteLength(json)} bytes, over ${MAX_BYTES}`); process.exit(1); }
fs.writeFileSync(path.join(__dirname, '../lib/suggestions.json'), json + '\n');

const by = (k: string) => list.filter((s) => s.kind === k).length;
console.log(`${list.length} suggestions (${by('topic')} topic, ${by('keyword')} keyword, ${by('course')} course, ${by('title')} title), ${Buffer.byteLength(json)} bytes`);
