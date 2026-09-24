import { createHash } from 'node:crypto';
import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';
import docsSnapshot from './data/all_docs.json';
import relationsSnapshot from './data/all_relations.json';

type SnapshotHit<T> = { _id?: string; _source: T };
type Snapshot<T> = { hits: { hits: SnapshotHit<T>[] } };

function stableId(prefix: string, source: Record<string, unknown>): string {
  const key =
    typeof source.url === 'string' && source.url.length > 0
      ? source.url
      : JSON.stringify(source);
  return `${prefix}-${createHash('sha1').update(key).digest('hex')}`;
}

async function restore() {
  const docs = (docsSnapshot as Snapshot<Record<string, unknown>>).hits.hits;
  const relations = (relationsSnapshot as Snapshot<Record<string, unknown>>).hits.hits;

  const docOps = docs.flatMap((hit) => {
    const id = hit._id || stableId('doc', hit._source);
    return [{ index: { _index: DOCS_INDEX, _id: id } }, hit._source];
  });
  const docResult = await esClient.bulk({ operations: docOps, refresh: true });
  const docErrors = docResult.items.filter((i) => i.index?.error);
  console.log(
    `Upserted ${docs.length - docErrors.length}/${docs.length} documents` +
      (docErrors.length ? ` (${docErrors.length} errors)` : ''),
  );

  const relOps = relations.flatMap((hit) => {
    const id = hit._id || stableId('rel', hit._source);
    return [{ index: { _index: RELATIONS_INDEX, _id: id } }, hit._source];
  });
  const relResult = await esClient.bulk({ operations: relOps, refresh: true });
  const relErrors = relResult.items.filter((i) => i.index?.error);
  console.log(
    `Upserted ${relations.length - relErrors.length}/${relations.length} relations` +
      (relErrors.length ? ` (${relErrors.length} errors)` : ''),
  );
}

restore()
  .then(() => {
    console.log('Restore complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Restore failed:', err);
    process.exit(1);
  });
