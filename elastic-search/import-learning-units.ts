/**
 * Puts the AI-drafted learning-path fields (data/learning-units.json) onto the matching documents.
 *
 *   tsx elastic-search/import-learning-units.ts            checks the units against the concepts and the document snapshot; ES is not touched
 *   APPLY=1 tsx elastic-search/import-learning-units.ts    also adds teaches/needs/difficulty/concept_source to ku_bcg_documents (re-runnable)
 *
 * Local ES only: it stops if ES_NODE is not localhost. These fields are unreviewed AI drafts; keep them off production until an expert has checked them.
 */
import fs from 'fs';
import path from 'path';
import { esClient, DOCS_INDEX } from './es-client';
import { checkUnits, type LearningUnit } from '../lib/learningPath';

const apply = Boolean(process.env.APPLY);
const node = process.env.ES_NODE || 'http://localhost:9200';
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

(async () => {
  if (apply && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]?/.test(node)) throw new Error(`ES_NODE is ${node}: refusing to write outside localhost`);

  const units: (LearningUnit & { url: string; concept_source: string })[] = read('data/learning-units.json');
  const conceptIds = read('../lib/learningConcepts.json').map((c: { id: string }) => c.id);
  const errors = checkUnits(units, conceptIds);
  if (errors.length) throw new Error(`units are invalid:\n  ${errors.join('\n  ')}`);

  const urls = new Set<string>(read('data/all_docs.json').hits.hits.map((h: { _source: { url: string } }) => h._source.url));
  const missing = units.filter((u) => !urls.has(u.url));
  console.log(`${units.length} units, ${missing.length} without a document in the snapshot`);
  missing.forEach((u) => console.log(`  no document: ${u.url}`));
  if (!apply) return console.log('ES not touched');

  await esClient.indices.putMapping({ index: DOCS_INDEX, properties: {
    teaches: { type: 'keyword' }, needs: { type: 'keyword' }, difficulty: { type: 'byte' }, concept_source: { type: 'keyword' },
  } });
  for (const u of units) {
    const res = await esClient.updateByQuery({
      index: DOCS_INDEX, refresh: true, conflicts: 'proceed',
      query: { term: { url: u.url } },
      script: { lang: 'painless', source: 'ctx._source.teaches = params.t; ctx._source.needs = params.n; ctx._source.difficulty = params.d; ctx._source.concept_source = params.s', params: { t: u.teaches, n: u.needs, d: u.difficulty, s: u.concept_source } },
    });
    if (res.updated !== 1) console.log(`  ${u.url}: updated ${res.updated}`);
  }
  console.log('APPLIED to', node);
})().catch((e) => { console.error(e); process.exit(1); });
