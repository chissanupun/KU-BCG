import { Client } from '@elastic/elasticsearch';

export const esClient = new Client({
  node: process.env.ES_NODE || 'http://localhost:9200',
});

export const DOCS_INDEX = 'ku_bcg_documents';
export const RELATIONS_INDEX = 'ku_bcg_relations';
