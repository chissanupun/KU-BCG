import { esClient, DOCS_INDEX } from './es-client';
import { scrapeKUForest } from './scrapers/ku-forest';
import seedData from './seed-data.json';

const topicNameMap = new Map(seedData.topics.map((t) => [t.id, { th: t.name_th, en: t.name_en }]));

(async () => {
  await esClient.ping();
  console.log('ES connected\n');

  const docs = await scrapeKUForest();
  if (!docs.length) { console.log('No docs'); process.exit(0); }

  const enriched = docs.map((d) => ({
    ...d,
    topic_names_th: d.topic_ids.map((id) => topicNameMap.get(id)?.th).filter(Boolean),
    topic_names_en: d.topic_ids.map((id) => topicNameMap.get(id)?.en).filter(Boolean),
  }));

  const operations = enriched.flatMap((doc) => [{ index: { _index: DOCS_INDEX } }, doc]);
  const result = await esClient.bulk({ operations, refresh: true });
  const errors = result.items.filter((i) => i.index?.error).length;
  console.log(`\nIndexed ${docs.length - errors}/${docs.length} KU Forest docs`);

  const total = await esClient.count({ index: DOCS_INDEX });
  console.log(`Total in ES: ${total.count}`);
})();
