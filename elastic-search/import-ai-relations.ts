/**
 * Checks the AI-drafted relations (data/ai-proposals.json) against the data and turns them into rows with origin "ai_suggested".
 *
 *   tsx elastic-search/import-ai-relations.ts            writes data/ai-relations.json and lib/conceptLabels.json, lists what was dropped; ES is not touched
 *   APPLY=1 tsx elastic-search/import-ai-relations.ts    also replaces the origin=ai_suggested relations in ES (re-runnable)
 *
 * Local ES only: it stops if ES_NODE is not localhost. These are drafts nobody has reviewed; keep them off production until
 * people have checked a sample, and the snapshot all_relations.json is deliberately not changed.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { esClient, RELATIONS_INDEX } from './es-client';
import { toRelations, type Concept, type Proposal } from './ai-relations';
import { PREDICATE_TH } from '../lib/kgText';
import { graphMetrics } from './graph-metrics';

const apply = Boolean(process.env.APPLY);
const node = process.env.ES_NODE || 'http://localhost:9200';
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

(async () => {
  if (apply && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]?/.test(node)) throw new Error(`ES_NODE is ${node}: refusing to write outside localhost`);

  const concepts: Concept[] = read('data/ai-concepts.json');
  const { relations, dropped } = toRelations(read('data/ai-proposals.json') as Proposal[], {
    topics: read('seed-data.json').topics,
    docs: read('data/all_docs.json').hits.hits.map((h: { _source: { title: string; url: string } }) => h._source),
    concepts,
    predicates: Object.keys(PREDICATE_TH),
    curated: read('data/all_relations.json').hits.hits.map((h: { _source: never }) => h._source),
  });

  fs.writeFileSync(path.join(__dirname, 'data/ai-relations.json'), JSON.stringify(relations, null, 2) + '\n');
  fs.writeFileSync(path.join(__dirname, '../lib/conceptLabels.json'), JSON.stringify(Object.fromEntries(concepts.map((c) => [c.id, c.name_th])), null, 2) + '\n');
  console.log(`${relations.length} relations kept, ${dropped.length} dropped`);
  dropped.forEach((d) => console.log(`  dropped: ${d.reason} (${d.proposal.subject} ${d.proposal.predicate} ${d.proposal.object})`));

  const curated: { subject: string; object: string; topic_id: string }[] = read('data/all_relations.json').hits.hits.map((h: { _source: never }) => h._source);
  const derived: typeof curated = read('data/derived-relations.json');
  console.log('\ntopic  edges/node  components   (curated + derived -> plus AI drafts)');
  for (const t of read('seed-data.json').topics) {
    const edges = (list: typeof curated) => list.filter((r) => r.topic_id === t.id).map((r) => ({ from: r.subject, to: r.object }));
    const before = graphMetrics(edges([...curated, ...derived]));
    const after = graphMetrics(edges([...curated, ...derived, ...relations]));
    console.log(`${t.id} ${t.name_en.padEnd(38)} ${before.edgesPerNode} -> ${after.edgesPerNode}   ${before.components} -> ${after.components}   (${before.nodes} -> ${after.nodes} nodes)`);
  }
  if (!apply) return console.log('\nES not touched');

  await esClient.indices.putMapping({ index: RELATIONS_INDEX, properties: {
    origin: { type: 'keyword' }, weight: { type: 'float' }, confidence: { type: 'float' }, reason_th: { type: 'text', index: false },
  } });
  await esClient.deleteByQuery({ index: RELATIONS_INDEX, query: { term: { origin: 'ai_suggested' } }, refresh: true });
  const id = (r: (typeof relations)[number]) => `ai-${crypto.createHash('sha1').update(`${r.subject}|${r.predicate}|${r.object}|${r.source_doc_url ?? ''}|${r.target_doc_url ?? ''}`).digest('hex')}`;
  const res = await esClient.bulk({ refresh: true, operations: relations.flatMap((r) => [{ index: { _index: RELATIONS_INDEX, _id: id(r) } }, r]) });
  if (res.errors) throw new Error(`bulk had errors: ${JSON.stringify(res.items.find((i) => i.index?.error))}`);
  console.log('\nAPPLIED to', node);
})().catch((e) => { console.error(e); process.exit(1); });
