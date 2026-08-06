import { Client, ClientOptions } from '@elastic/elasticsearch';

function buildClientOptions(): ClientOptions {
  const node = process.env.ES_NODE || 'http://localhost:9200';
  const options: ClientOptions = { node };

  const apiKey = process.env.ES_API_KEY?.trim();
  if (apiKey) {
    options.auth = { apiKey };
    return options;
  }

  const username = process.env.ES_USERNAME?.trim();
  const password = process.env.ES_PASSWORD ?? '';
  if (username) {
    options.auth = { username, password };
  }

  return options;
}

export const esClient = new Client(buildClientOptions());

export const DOCS_INDEX = process.env.ES_DOCS_INDEX || 'ku_bcg_documents';
export const RELATIONS_INDEX = process.env.ES_RELATIONS_INDEX || 'ku_bcg_relations';
