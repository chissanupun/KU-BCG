import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';

async function setupIndices() {
  // Documents index
  const docsExists = await esClient.indices.exists({ index: DOCS_INDEX });
  if (docsExists) {
    await esClient.indices.delete({ index: DOCS_INDEX });
    console.log(`Deleted existing index: ${DOCS_INDEX}`);
  }

  await esClient.indices.create({
    index: DOCS_INDEX,
    settings: {
      analysis: {
        analyzer: {
          thai_custom: { type: 'custom', tokenizer: 'thai', filter: ['lowercase'] },
          mixed_analyzer: { type: 'custom', tokenizer: 'standard', filter: ['lowercase', 'asciifolding'] },
        },
      },
    },
    mappings: {
      properties: {
        source:           { type: 'keyword' },
        title:            { type: 'text', analyzer: 'thai_custom', fields: { keyword: { type: 'keyword' } } },
        title_en:         { type: 'text', analyzer: 'mixed_analyzer' },
        abstract:         { type: 'text', analyzer: 'thai_custom' },
        authors:          { type: 'keyword' },
        year:             { type: 'integer' },
        url:              { type: 'keyword' },
        topic_ids:        { type: 'keyword' },
        topic_names_th:   { type: 'text', analyzer: 'thai_custom' },
        topic_names_en:   { type: 'text', analyzer: 'mixed_analyzer' },
        bcg_pillars:      { type: 'keyword' },
        faculties:        { type: 'keyword' },
        keywords:         { type: 'text', analyzer: 'thai_custom' },
        search_keyword:   { type: 'keyword' },
        doc_type:         { type: 'keyword' },
        indexed_at:       { type: 'date' },
      },
    },
  });
  console.log(`Created index: ${DOCS_INDEX}`);

  // Relations index
  const relExists = await esClient.indices.exists({ index: RELATIONS_INDEX });
  if (relExists) {
    await esClient.indices.delete({ index: RELATIONS_INDEX });
    console.log(`Deleted existing index: ${RELATIONS_INDEX}`);
  }

  await esClient.indices.create({
    index: RELATIONS_INDEX,
    mappings: {
      properties: {
        subject:          { type: 'text', fields: { keyword: { type: 'keyword' } } },
        predicate:        { type: 'keyword' },
        object:           { type: 'text', fields: { keyword: { type: 'keyword' } } },
        topic_id:         { type: 'keyword' },
        source_doc_url:   { type: 'keyword' },
        target_doc_url:   { type: 'keyword' },
      },
    },
  });
  console.log(`Created index: ${RELATIONS_INDEX}`);
}

setupIndices()
  .then(() => { console.log('Index setup complete'); process.exit(0); })
  .catch((err) => { console.error('Setup failed:', err); process.exit(1); });
