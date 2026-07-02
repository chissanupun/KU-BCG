import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';
import docsSnapshot from './data/all_docs.json';
import relationsSnapshot from './data/all_relations.json';

type SnapshotHit<T> = { _source: T };
type Snapshot<T> = { hits: { hits: SnapshotHit<T>[] } };

async function restore() {
  const docs = (docsSnapshot as Snapshot<Record<string, unknown>>).hits.hits.map((h) => h._source);
  const relations = (relationsSnapshot as Snapshot<Record<string, unknown>>).hits.hits.map((h) => h._source);

  const docOps = docs.flatMap((doc) => [{ index: { _index: DOCS_INDEX } }, doc]);
  const docResult = await esClient.bulk({ operations: docOps, refresh: true });
  const docErrors = docResult.items.filter((i) => i.index?.error);
  console.log(`Restored ${docs.length - docErrors.length}/${docs.length} documents${docErrors.length ? ` (${docErrors.length} errors)` : ''}`);

  const relOps = relations.flatMap((rel) => [{ index: { _index: RELATIONS_INDEX } }, rel]);
  const relResult = await esClient.bulk({ operations: relOps, refresh: true });
  const relErrors = relResult.items.filter((i) => i.index?.error);
  console.log(`Restored ${relations.length - relErrors.length}/${relations.length} relations${relErrors.length ? ` (${relErrors.length} errors)` : ''}`);
}

restore()
  .then(() => { console.log('Restore complete'); process.exit(0); })
  .catch((err) => { console.error('Restore failed:', err); process.exit(1); });
