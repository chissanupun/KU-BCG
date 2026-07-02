import { NextRequest, NextResponse } from 'next/server';
import { pipeline, type FeatureExtractionPipeline } from '@xenova/transformers';
import { esClient, DOCS_INDEX, RELATIONS_INDEX } from '@/elastic-search/es-client';
import { summarizeSearchResults } from '@/lib/gemini';

const MODEL = 'Xenova/multilingual-e5-small';

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

async function embedQuery(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(`query: ${text}`, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

type DocHit = {
  source?: string;
  title?: string;
  title_en?: string;
  abstract?: string;
  authors?: string[];
  year?: string | number;
  url?: string;
  topic_ids?: string[];
  topic_names_th?: string[];
  topic_names_en?: string[];
  bcg_pillars?: string[];
  keywords?: string[];
  doc_type?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const topic = searchParams.get('topic') ?? undefined;
  const source = searchParams.get('source') ?? undefined;

  if (!q) {
    return NextResponse.json({ total: 0, by_source: {}, relations: [] });
  }

  const filter = [
    ...(topic ? [{ term: { topic_ids: topic } }] : []),
    ...(source ? [{ term: { source } }] : []),
  ];

  const queryVector = await embedQuery(q);

  const result = await esClient.search<DocHit>({
    index: DOCS_INDEX,
    size: 30,
    knn: {
      field: 'embedding',
      query_vector: queryVector,
      k: 50,
      num_candidates: 200,
      filter,
    },
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ['title^3', 'title_en^3', 'abstract^2', 'keywords', 'topic_names_th', 'topic_names_en'],
              type: 'best_fields',
            },
          },
        ],
        filter,
      },
    },
  });

  const bySource: Record<string, unknown[]> = {};
  const topicIds = new Set<string>();

  for (const hit of result.hits.hits) {
    const doc = hit._source;
    if (!doc) continue;
    const key = doc.source ?? 'Unknown';
    if (!bySource[key]) bySource[key] = [];
    bySource[key].push({
      id: hit._id,
      score: hit._score,
      title: doc.title,
      title_en: doc.title_en,
      abstract: doc.abstract,
      authors: doc.authors,
      year: doc.year,
      url: doc.url,
      topic_names_th: doc.topic_names_th,
      topic_names_en: doc.topic_names_en,
      bcg_pillars: doc.bcg_pillars,
      keywords: doc.keywords,
      doc_type: doc.doc_type,
    });
    doc.topic_ids?.forEach((id) => topicIds.add(id));
  }

  let relations: unknown[] = [];
  if (topicIds.size > 0) {
    const relResult = await esClient.search({
      index: RELATIONS_INDEX,
      size: 100,
      query: { terms: { topic_id: Array.from(topicIds) } },
    });
    relations = relResult.hits.hits.map((h) => h._source);
  }

  const total = typeof result.hits.total === 'number' ? result.hits.total : result.hits.total?.value ?? 0;

  const summary = await summarizeSearchResults(
    q,
    result.hits.hits.map((hit) => ({
      title: hit._source?.title,
      abstract: hit._source?.abstract,
      source: hit._source?.source,
    })),
  );

  return NextResponse.json({ total, by_source: bySource, relations, summary });
}
