import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';
import { scrapeKUForest, type KUForestDoc } from './scrapers/ku-forest';
import { scrapeKUKR, type KUKRDoc } from './scrapers/kukr';
import { scrapeKUMOOC, type KUMOOCDoc } from './scrapers/ku-mooc';
import seedData from './seed-data.json';

type AnyDoc = (KUForestDoc | KUKRDoc | KUMOOCDoc) & {
  topic_names_th?: string[];
  topic_names_en?: string[];
};

async function indexDocuments(docs: AnyDoc[]) {
  if (docs.length === 0) return;
  const operations = docs.flatMap((doc) => [{ index: { _index: DOCS_INDEX } }, doc]);
  const result = await esClient.bulk({ operations, refresh: true });
  const errors = result.items.filter((i) => i.index?.error);
  if (errors.length > 0) console.warn(`  ${errors.length} indexing errors`);
  console.log(`  Indexed ${docs.length - errors.length}/${docs.length} docs`);
}

async function indexRelations() {
  const relations = seedData.topics.flatMap((topic) =>
    topic.relations.map((rel) => ({
      subject: rel.subject,
      predicate: rel.predicate,
      object: rel.object,
      topic_id: topic.id,
    })),
  );
  const operations = relations.flatMap((r) => [{ index: { _index: RELATIONS_INDEX } }, r]);
  await esClient.bulk({ operations, refresh: true });
  console.log(`Indexed ${relations.length} semantic relations`);
}

async function run() {
  console.log('=== KU-BCG Ingestion Pipeline ===\n');

  try {
    await esClient.ping();
    console.log('ES connected\n');
  } catch {
    console.error('Cannot connect to Elasticsearch at http://localhost:9200');
    console.error('Run: docker run -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" elasticsearch:8.13.0');
    process.exit(1);
  }

  console.log('Scraping sources...\n');
  const [forestDocs, kukrDocs, moocDocs] = await Promise.all([
    scrapeKUForest(),
    scrapeKUKR(),
    scrapeKUMOOC(),
  ]);

  console.log(`\nScraped: KU Forest=${forestDocs.length}, KUKR=${kukrDocs.length}, KU MOOC=${moocDocs.length}`);

  const topicNameMap = new Map(
    seedData.topics.map((t) => [t.id, { th: t.name_th, en: t.name_en }]),
  );

  const enrich = (docs: (KUForestDoc | KUKRDoc | KUMOOCDoc)[]): AnyDoc[] =>
    docs.map((doc) => ({
      ...doc,
      topic_names_th: doc.topic_ids.map((id) => topicNameMap.get(id)?.th).filter(Boolean) as string[],
      topic_names_en: doc.topic_ids.map((id) => topicNameMap.get(id)?.en).filter(Boolean) as string[],
    }));

  console.log('\nIndexing documents...');
  await indexDocuments(enrich(forestDocs));
  await indexDocuments(enrich(kukrDocs));
  await indexDocuments(enrich(moocDocs));

  console.log('\nIndexing semantic relations...');
  await indexRelations();

  const count = await esClient.count({ index: DOCS_INDEX });
  console.log(`\nDone. Total documents in ES: ${count.count}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
