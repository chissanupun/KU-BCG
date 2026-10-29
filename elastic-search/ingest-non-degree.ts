/**
 * Loads the Non-Degree courses (data/non-degree-courses.json) into ES as source KU_NonDegree, plus an `isCourseFor`
 * relation per course-topic pair, and mirrors them in the data/all_docs.json and all_relations.json snapshots.
 *
 *   tsx elastic-search/ingest-non-degree.ts            dry run: prints counts, writes nothing
 *   APPLY=1 tsx elastic-search/ingest-non-degree.ts    replaces the KU_NonDegree docs and isCourseFor relations (re-runnable)
 *
 * Local ES only: it stops if ES_NODE is not localhost. Production is loaded by the backend owner, not from here.
 */
import fs from 'fs';
import path from 'path';
import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';
import { buildNonDegreeDocs, buildNonDegreeTriples, type NonDegreeCourse } from './non-degree';
import { pretty } from './snapshot-format';

const apply = Boolean(process.env.APPLY);
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const node = process.env.ES_NODE || 'http://localhost:9200';

/** Replaces this ingest's entries in a `_search` dump and fixes its total; `write` matches how that file is already formatted. */
function mirror(file: string, write: (v: unknown) => string, isOurs: (src: Record<string, unknown>) => boolean, index: string, entries: { id: string; src: object }[]) {
  const dump = read(file);
  const kept = dump.hits.hits.filter((h: { _source: Record<string, unknown> }) => !isOurs(h._source));
  dump.hits.hits = [...kept, ...entries.map(({ id, src }) => ({ _index: index, _id: id, _score: 1.0, _source: src }))];
  dump.hits.total.value = dump.hits.hits.length;
  fs.writeFileSync(path.join(__dirname, file), write(dump) + '\n');
}

(async () => {
  if (apply && !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]?/.test(node)) throw new Error(`ES_NODE is ${node}: refusing to write outside localhost`);

  const courses: NonDegreeCourse[] = read('data/non-degree-courses.json');
  const { topics } = read('seed-data.json');
  const docs = buildNonDegreeDocs(courses, topics);
  const triples = buildNonDegreeTriples(courses, topics);
  console.log(`${docs.length} course documents, ${triples.length} isCourseFor relations`);
  if (!apply) return console.log('DRY RUN: nothing written');

  const docEntries = docs.map((src, i) => ({ id: `non-degree-${i + 1}`, src }));
  const relEntries = triples.map((src, i) => ({ id: `non-degree-rel-${i + 1}`, src }));

  await esClient.deleteByQuery({ index: DOCS_INDEX, query: { term: { source: 'KU_NonDegree' } }, refresh: true });
  await esClient.deleteByQuery({ index: RELATIONS_INDEX, query: { term: { predicate: 'isCourseFor' } }, refresh: true });
  for (const [index, entries] of [[DOCS_INDEX, docEntries], [RELATIONS_INDEX, relEntries]] as const) {
    const res = await esClient.bulk({ refresh: true, operations: entries.flatMap(({ id, src }) => [{ index: { _index: index, _id: id } }, src]) });
    if (res.errors) throw new Error(`bulk into ${index} had errors: ${JSON.stringify(res.items.find((i) => i.index?.error))}`);
  }

  mirror('data/all_docs.json', (v) => pretty(v), (s) => s.source === 'KU_NonDegree', DOCS_INDEX, docEntries);
  mirror('data/all_relations.json', (v) => JSON.stringify(v, null, 2).replace(/("(?:max)?_score": )1(?=[,\n])/g, (_, k) => `${k}1.0`), (s) => s.predicate === 'isCourseFor', RELATIONS_INDEX, relEntries);
  console.log('APPLIED');
})().catch((e) => { console.error(e); process.exit(1); });
