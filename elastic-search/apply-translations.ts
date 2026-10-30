/**
 * Adds the AI Thai translations (data/translations.json) next to the English originals; originals are never changed.
 *
 *   tsx elastic-search/apply-translations.ts            dry run: counts, automatic checks, writes docs/gates/translation/ for human review
 *   APPLY=1 tsx elastic-search/apply-translations.ts    also updates ES (by url / entity, re-runnable) and the snapshots in data/
 *
 * Local ES only: it stops if ES_NODE is not localhost. Test against a scratch index with ES_DOCS_INDEX / ES_RELATIONS_INDEX.
 * Translations that fail a hard check (empty, a number missing) are not imported; soft flags are imported and listed in
 * docs/gates/translation/flagged.tsv so a person can look at them.
 */
import fs from 'fs';
import path from 'path';
import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';
import { buildDocPatch, buildRelationPatch, checkTranslation, hasThai, sha, type Cache, type DocLike } from './translation';
import { pretty } from './snapshot-format';

const apply = Boolean(process.env.APPLY);
const node = process.env.ES_NODE || 'http://localhost:9200';
const dataFile = (f: string) => path.join(__dirname, 'data', f);
const gateDir = path.join(__dirname, '..', 'docs/gates/translation');
const SET_FIELDS = 'for (e in params.f.entrySet()) { ctx._source[e.getKey()] = e.getValue(); }';

const MODEL = 'claude-sonnet-5-5';
const meta = { model: MODEL, prompt_version: 'v1', translated_at: new Date().toISOString().slice(0, 10), source_lang: 'en' as const, reviewed: false as const };

type Hit<T> = { _source: T };
type Doc = DocLike & { url: string; source: string };
type Rel = { subject: string; object: string };

/** Every n-th item, so the review sample covers the whole list the same way each run. */
const spread = <T>(list: T[], n: number) => list.filter((_, i) => i % Math.max(1, Math.floor(list.length / n)) === 0).slice(0, n);

(async () => {
  if (apply && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]?/.test(node)) throw new Error(`ES_NODE is ${node}: refusing to write outside localhost`);

  const all: Cache = JSON.parse(fs.readFileSync(dataFile('translations.json'), 'utf8'));
  const checked = Object.entries(all).map(([key, e]) => ({ key, ...e, ...checkTranslation(e.src, e.th) }));
  const rejected = checked.filter((c) => c.hard.length);
  const cache: Cache = Object.fromEntries(checked.filter((c) => !c.hard.length).map(({ key, field, src, th, model }) => [key, { field, src, th, model }]));

  const docsDump = JSON.parse(fs.readFileSync(dataFile('all_docs.json'), 'utf8'));
  const relsDump = JSON.parse(fs.readFileSync(dataFile('all_relations.json'), 'utf8'));
  const docHits: Hit<Doc>[] = docsDump.hits.hits;
  const relHits: Hit<Rel>[] = relsDump.hits.hits;

  const docPatches = docHits.flatMap((h) => { const p = buildDocPatch(h._source, cache, meta); return p ? [{ hit: h, patch: p }] : []; });
  const relPatches = relHits.flatMap((h) => { const p = buildRelationPatch(h._source, cache, meta); return p ? [{ hit: h, patch: p }] : []; });

  const used = new Set<string>();
  const markUsed = (text?: string) => { if (text && !hasThai(text) && cache[sha(text)]) used.add(sha(text)); };
  for (const { hit } of docPatches) { markUsed(hit._source.title); markUsed(hit._source.abstract); hit._source.keywords?.forEach(markUsed); }
  for (const { hit } of relPatches) { markUsed(hit._source.subject); markUsed(hit._source.object); }
  const flagged = checked.filter((c) => used.has(c.key) && c.soft.length);

  const byField = (f: string) => docPatches.filter((p) => p.patch.ai_translation?.fields.includes(f)).length;
  console.log(`translations: ${checked.length}, rejected by hard checks: ${rejected.length}, used by the data: ${used.size}, soft-flagged (still imported): ${flagged.length}`);
  console.log(`docs with a translation: ${docPatches.length}/${docHits.length} (title ${byField('title')}, abstract ${byField('abstract')}, keywords ${byField('keywords')})`);
  console.log(`relations with a translated entity: ${relPatches.length}/${relHits.length}`);
  rejected.forEach((r) => console.log(`  REJECTED ${r.field} "${r.src.slice(0, 50)}": ${r.hard.join(', ')}`));

  writeReviewFiles(checked.filter((c) => used.has(c.key)), flagged);

  if (!apply) return console.log('\nDRY RUN: ES and snapshots not touched');

  await esClient.indices.putMapping({ index: DOCS_INDEX, properties: {
    title_ai_th: { type: 'text', analyzer: 'thai_custom' }, abstract_ai_th: { type: 'text', analyzer: 'thai_custom' },
    keywords_ai_th: { type: 'text', analyzer: 'thai_custom' }, ai_translation: { type: 'object', enabled: false },
  } });
  await esClient.indices.putMapping({ index: RELATIONS_INDEX, properties: {
    subject_th: { type: 'text' }, object_th: { type: 'text' }, ai_translation: { type: 'object', enabled: false },
  } });

  for (const { hit, patch } of docPatches) {
    const res = await esClient.updateByQuery({ index: DOCS_INDEX, refresh: true, query: { term: { url: hit._source.url } }, script: { lang: 'painless', source: SET_FIELDS, params: { f: patch } } });
    if (res.updated !== 1 || res.version_conflicts) throw new Error(`ES updated ${res.updated} docs (conflicts ${res.version_conflicts}) for ${hit._source.url}`);
    Object.assign(hit._source, patch);
  }
  // Relations are patched per entity name, so this works on a cluster whose relation _ids differ from the snapshot's.
  const entities = new Map<string, string>();
  relPatches.forEach(({ hit, patch }) => { if (patch.subject_th) entities.set(hit._source.subject, patch.subject_th); if (patch.object_th) entities.set(hit._source.object, patch.object_th); });
  const entityMeta = { ...meta, fields: ['entity'] };
  for (const [name, th] of entities) {
    for (const [side, key] of [['subject', 'subject_th'], ['object', 'object_th']] as const) {
      await esClient.updateByQuery({ index: RELATIONS_INDEX, refresh: true, query: { term: { [`${side}.keyword`]: name } }, script: { lang: 'painless', source: SET_FIELDS, params: { f: { [key]: th, ai_translation: entityMeta } } } });
    }
  }
  relPatches.forEach(({ hit, patch }) => Object.assign(hit._source, patch));

  fs.writeFileSync(dataFile('all_docs.json'), pretty(docsDump) + '\n');
  // all_relations.json is stored as plain JSON.stringify output, all_docs.json in the ES dump style (pretty).
  fs.writeFileSync(dataFile('all_relations.json'), JSON.stringify(relsDump, null, 2) + '\n');
  console.log('\nAPPLIED to', node);
})().catch((e) => { console.error(e); process.exit(1); });

type Row = { field: string; src: string; th: string; hard: string[]; soft: string[] };

function writeReviewFiles(used: Row[], flagged: Row[]) {
  fs.mkdirSync(gateDir, { recursive: true });
  const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim().slice(0, 400);
  const section = (title: string, field: string, n: number) => {
    const rows = spread(used.filter((r) => r.field === field).sort((a, b) => sha(a.src).localeCompare(sha(b.src))), n);
    return [`## ${title} (${rows.length})`, '', '| # | ต้นฉบับ | คำแปล AI | ตรวจอัตโนมัติ | ผล (ผ่าน/แก้) | แก้เป็น |', '|---|---|---|---|---|---|',
      ...rows.map((r, i) => `| ${i + 1} | ${cell(r.src)} | ${cell(r.th)} | ${r.soft.join('; ') || 'ไม่มีธง'} | | |`), ''];
  };
  fs.writeFileSync(path.join(gateDir, 'review-sample.md'), [
    '# ตัวอย่างคำแปล AI สำหรับให้คนตรวจ', '',
    `สุ่มแบบกระจายสม่ำเสมอ (เรียงตาม hash ของต้นฉบับ จึงได้ชุดเดิมทุกครั้ง) จากคำแปลที่ถูกใช้จริง ${used.length} รายการ แปลโดย ${MODEL} ยังไม่มีคนตรวจ`,
    'ช่อง "ผล" ให้เติมว่า ผ่าน หรือ แก้ แล้วใส่คำที่ถูกในช่อง "แก้เป็น" ถ้าพบคำผิดเป็นชุด (เช่นชื่อพืช ชื่อสถานที่) ให้แจ้งเพื่อแก้ที่ glossary แล้วแปลซ้ำทั้งชุด', '',
    ...section('ชื่อเรื่อง', 'title', 12), ...section('บทคัดย่อ', 'abstract', 10), ...section('คำสำคัญ', 'keyword', 12), ...section('ชื่อ entity ในความสัมพันธ์', 'entity', 6),
  ].join('\n'));
  fs.writeFileSync(path.join(gateDir, 'flagged.tsv'), ['field\tflags\tsource\ttranslation', ...flagged.map((r) => [r.field, r.soft.join('; '), r.src, r.th].map((s) => s.replace(/\s+/g, ' ')).join('\t'))].join('\n') + '\n');
}
