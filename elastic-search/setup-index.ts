import { esClient, DOCS_INDEX, RELATIONS_INDEX } from './es-client';

const docsBody = {
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
      source: { type: 'keyword' },
      title: { type: 'text', analyzer: 'thai_custom', fields: { keyword: { type: 'keyword' } } },
      title_en: { type: 'text', analyzer: 'mixed_analyzer' },
      abstract: { type: 'text', analyzer: 'thai_custom' },
      abstract_en: { type: 'text', analyzer: 'mixed_analyzer' },
      authors: { type: 'keyword' },
      year: { type: 'integer' },
      url: { type: 'keyword' },
      topic_ids: { type: 'keyword' },
      topic_names_th: { type: 'text', analyzer: 'thai_custom' },
      topic_names_en: { type: 'text', analyzer: 'mixed_analyzer' },
      bcg_pillars: { type: 'keyword' },
      faculties: { type: 'keyword' },
      keywords: { type: 'text', analyzer: 'thai_custom' },
      search_keyword: { type: 'keyword' },
      doc_type: { type: 'keyword' },
      indexed_at: { type: 'date' },
      embedding: { type: 'dense_vector', dims: 384, index: true, similarity: 'cosine' },
    },
  },
} as const;

const relationsBody = {
  mappings: {
    properties: {
      subject: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      predicate: { type: 'keyword' },
      object: { type: 'text', fields: { keyword: { type: 'keyword' } } },
      topic_id: { type: 'keyword' },
      source_doc_url: { type: 'keyword' },
      target_doc_url: { type: 'keyword' },
    },
  },
} as const;

async function ensureIndex(index: string, body: Record<string, unknown>): Promise<void> {
  const exists = await esClient.indices.exists({ index });
  if (exists) {
    console.log(`Index already exists (skip create): ${index}`);
    return;
  }

  await esClient.indices.create({ index, ...body });
  console.log(`Created index: ${index}`);
}

async function setupIndices() {
  await ensureIndex(DOCS_INDEX, docsBody as unknown as Record<string, unknown>);
  await ensureIndex(RELATIONS_INDEX, relationsBody as unknown as Record<string, unknown>);
}

setupIndices()
  .then(() => {
    console.log('Index setup complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
  });
