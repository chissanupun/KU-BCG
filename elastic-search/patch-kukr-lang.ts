/**
 * Re-reads KUKR records and files Thai title/abstract under `title`/`abstract`, the English form under
 * `title_en`/`abstract_en` (rules in docs: projects/ku-bcg/แผน-KUKR-ข้อมูลภาษาไทย).
 *
 *   tsx elastic-search/patch-kukr-lang.ts            dry run: prints before/after, writes nothing
 *   APPLY=1 tsx elastic-search/patch-kukr-lang.ts    updates ES (by url, so it works on any cluster) and data/all_docs.json
 *
 * Needs `abstract_en` in the index mapping first (see the put-mapping note in the plan). Re-runnable.
 * It scrapes kukr.lib.ku.ac.th (sequential, rate-limited inside scrapeKUKR); do not run it in parallel.
 */
import fs from 'fs';
import path from 'path';
import { esClient, DOCS_INDEX } from './es-client';
import { mergeLang, type KukrLang } from './kukr-lang';
import { scrapeKUKR } from './scrapers/kukr';
import { pretty } from './snapshot-format';

const FIELDS = ['title', 'title_en', 'abstract', 'abstract_en'] as const;
const apply = Boolean(process.env.APPLY);
const same = (a: Partial<KukrLang>, b: Partial<KukrLang>) => FIELDS.every((f) => (a[f] ?? '') === (b[f] ?? ''));

(async () => {
  const fresh = new Map((await scrapeKUKR()).map((d) => [d.url, d]));
  console.log(`scraped ${fresh.size} KUKR records`);

  const file = path.join(__dirname, 'data/all_docs.json');
  const dump = JSON.parse(fs.readFileSync(file, 'utf8'));
  const hits = dump.hits.hits.filter((h: { _source: { source: string } }) => h._source.source === 'KUKR');

  let changed = 0, unchanged = 0, missing = 0, thaiTitles = 0;
  for (const hit of hits) {
    const src = hit._source as Partial<KukrLang> & { url: string };
    const doc = fresh.get(src.url);
    if (!doc) { missing++; continue; }
    const next = mergeLang(src, doc);
    if (next.title && /[฀-๿]/.test(next.title)) thaiTitles++;
    if (same(src, next)) { unchanged++; continue; }
    changed++;
    console.log(`  ${src.url.split('/').pop()}\n    was: ${(src.title ?? '').slice(0, 70)}\n    now: ${(next.title ?? '').slice(0, 70)}`);
    if (!apply) continue;
    const res = await esClient.updateByQuery({
      index: DOCS_INDEX,
      query: { term: { url: src.url } },
      script: { lang: 'painless', source: 'for (e in params.f.entrySet()) { ctx._source[e.getKey()] = e.getValue(); }', params: { f: next } },
    });
    if (res.updated !== 1 || res.version_conflicts) throw new Error(`ES updated ${res.updated} docs (conflicts ${res.version_conflicts}) for ${src.url}`);
    Object.assign(src, next);
  }

  if (apply) {
    await esClient.indices.refresh({ index: DOCS_INDEX });
    fs.writeFileSync(file, pretty(dump) + '\n');
  }
  console.log(`${apply ? 'APPLIED' : 'DRY RUN'}: changed ${changed}, unchanged ${unchanged}, not returned by KUKR ${missing}; Thai titles after: ${thaiTitles}/${hits.length}`);
})().catch((e) => { console.error(e); process.exit(1); });
