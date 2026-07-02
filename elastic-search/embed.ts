import { pipeline } from '@xenova/transformers';
import { esClient, DOCS_INDEX } from './es-client';

const MODEL = 'Xenova/multilingual-e5-small';
const BATCH_SIZE = 16;

type DocSource = {
  title?: string;
  title_en?: string;
  abstract?: string;
  keywords?: string[];
};

function docToText(doc: DocSource): string {
  const parts = [doc.title, doc.title_en, doc.abstract, doc.keywords?.join(' ')].filter(Boolean);
  return `passage: ${parts.join(' — ')}`.slice(0, 2000);
}

async function embedAll() {
  console.log(`Loading ${MODEL}...`);
  const extractor = await pipeline('feature-extraction', MODEL);

  const all: { id: string; source: DocSource }[] = [];
  let resp = await esClient.search({
    index: DOCS_INDEX,
    scroll: '2m',
    size: 100,
    query: { match_all: {} },
  });

  while (resp.hits.hits.length > 0) {
    for (const hit of resp.hits.hits) {
      all.push({ id: hit._id as string, source: hit._source as DocSource });
    }
    if (!resp._scroll_id) break;
    resp = await esClient.scroll({ scroll_id: resp._scroll_id, scroll: '2m' });
  }
  if (resp._scroll_id) await esClient.clearScroll({ scroll_id: resp._scroll_id });

  console.log(`Embedding ${all.length} documents in batches of ${BATCH_SIZE}...`);

  let done = 0;
  for (let i = 0; i < all.length; i += BATCH_SIZE) {
    const batch = all.slice(i, i + BATCH_SIZE);
    const texts = batch.map((d) => docToText(d.source));
    const output = await extractor(texts, { pooling: 'mean', normalize: true });
    const vectors: number[][] = output.tolist();

    const operations = batch.flatMap((d, idx) => [
      { update: { _index: DOCS_INDEX, _id: d.id } },
      { doc: { embedding: vectors[idx] } },
    ]);
    const result = await esClient.bulk({ operations, refresh: false });
    const errors = result.items.filter((it) => it.update?.error);
    if (errors.length) console.warn(`  ${errors.length} update errors in batch starting at ${i}`);

    done += batch.length;
    console.log(`  ${done}/${all.length}`);
  }

  await esClient.indices.refresh({ index: DOCS_INDEX });
  console.log('Embedding complete');
}

embedAll()
  .then(() => process.exit(0))
  .catch((err) => { console.error('Embed failed:', err); process.exit(1); });
