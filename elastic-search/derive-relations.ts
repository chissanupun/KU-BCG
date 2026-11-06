/**
 * Computes the derived relations (see derived.ts) from data/all_docs.json and writes them to data/derived-relations.json,
 * then prints how connected each topic's relations are before and after.
 *
 *   tsx elastic-search/derive-relations.ts            writes the JSON file only; ES is not touched
 *   APPLY=1 tsx elastic-search/derive-relations.ts    also replaces the origin=derived relations in ES (re-runnable)
 *
 * Local ES only: it stops if ES_NODE is not localhost. The snapshot all_relations.json is deliberately not changed,
 * so `es:restore` keeps loading curated relations only until the backend ranks curated above derived.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { esClient, RELATIONS_INDEX } from './es-client';
import { deriveRelations, type DerivDoc } from './derived';
import { graphMetrics } from './graph-metrics';

const apply = Boolean(process.env.APPLY);
const node = process.env.ES_NODE || 'http://localhost:9200';
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));

(async () => {
  if (apply && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]?/.test(node)) throw new Error(`ES_NODE is ${node}: refusing to write outside localhost`);

  const docs: DerivDoc[] = read('data/all_docs.json').hits.hits.map((h: { _source: DerivDoc }) => h._source);
  const curated: { subject: string; object: string; topic_id: string }[] = read('data/all_relations.json').hits.hits.map((h: { _source: never }) => h._source);
  const { topics } = read('seed-data.json');
  const derived = deriveRelations(docs, topics);

  fs.writeFileSync(path.join(__dirname, 'data/derived-relations.json'), JSON.stringify(derived, null, 2) + '\n');
  const count = (key: (t: (typeof derived)[number]) => string) =>
    Object.entries(derived.reduce<Record<string, number>>((acc, t) => ({ ...acc, [key(t)]: (acc[key(t)] ?? 0) + 1 }), {}));
  console.log(`${derived.length} derived relations`, Object.fromEntries(count((t) => t.predicate)));

  console.log('\ntopic  edges/node  components   (relations of that topic: curated -> curated + derived)');
  for (const t of topics) {
    const edges = (list: { subject: string; object: string; topic_id: string }[]) =>
      list.filter((r) => r.topic_id === t.id).map((r) => ({ from: r.subject, to: r.object }));
    const before = graphMetrics(edges(curated));
    const after = graphMetrics(edges([...curated, ...derived]));
    console.log(`${t.id} ${t.name_en.padEnd(38)} ${before.edgesPerNode} -> ${after.edgesPerNode}   ${before.components} -> ${after.components}   (${before.nodes} -> ${after.nodes} nodes)`);
  }
  if (!apply) return console.log('\nES not touched');

  await esClient.indices.putMapping({ index: RELATIONS_INDEX, properties: { origin: { type: 'keyword' }, weight: { type: 'float' } } });
  await esClient.deleteByQuery({ index: RELATIONS_INDEX, query: { term: { origin: 'derived' } }, refresh: true });
  const id = (t: (typeof derived)[number]) => `derived-${crypto.createHash('sha1').update(`${t.subject}|${t.predicate}|${t.object}|${t.source_doc_url ?? ""}|${t.target_doc_url ?? ""}`).digest('hex')}`;
  const res = await esClient.bulk({ refresh: true, operations: derived.flatMap((t) => [{ index: { _index: RELATIONS_INDEX, _id: id(t) } }, t]) });
  if (res.errors) throw new Error(`bulk had errors: ${JSON.stringify(res.items.find((i) => i.index?.error))}`);
  console.log('\nAPPLIED to', node);
})().catch((e) => { console.error(e); process.exit(1); });
