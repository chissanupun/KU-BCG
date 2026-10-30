import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveRelations, RULES, type DerivDoc } from './derived';
import { graphMetrics } from './graph-metrics';

const topics = [{ id: '1', name_en: 'Biomass' }, { id: '2', name_en: 'Fish' }];
const doc = (n: number, keywords: string[], topic = '1'): DerivDoc => ({ title: `doc${n}`, url: `u${n}`, keywords, topic_ids: [topic] });

test('R1 links a keyword to the topic it is characteristic of, with its doc count as weight', () => {
  const docs = [doc(1, ['Biomass']), doc(2, ['biomass ']), doc(3, ['BIOMASS']), doc(4, ['Biomass'], '2')];
  const t = deriveRelations(docs, topics).filter((r) => r.predicate === 'isKeywordOf');
  assert.deepEqual(t.map((r) => [r.subject, r.object, r.weight]), [['Biomass', 'Biomass', 3]]);
});

test('R1 skips a keyword spread across topics', () => {
  const docs = [doc(1, ['thailand']), doc(2, ['thailand']), doc(3, ['thailand']), doc(4, ['thailand'], '2'), doc(5, ['thailand'], '2'), doc(6, ['thailand'], '2')];
  assert.equal(deriveRelations(docs, topics).filter((r) => r.predicate === 'isKeywordOf').length, 0);
});

test('R2 pairs docs sharing enough keywords and records both urls', () => {
  const kw = ['aaa', 'bbb', 'ccc'];
  const pairs = deriveRelations([doc(1, kw), doc(2, kw), doc(3, ['aaa', 'bbb'])], topics).filter((r) => r.predicate === 'sharesKeywordWith');
  assert.equal(pairs.length, 1);
  assert.deepEqual([pairs[0].source_doc_url, pairs[0].target_doc_url, pairs[0].weight, pairs[0].origin], ['u1', 'u2', 3, 'derived']);
});

test('R2 ignores keywords that are too common and keeps only the best partners per doc', () => {
  const common = Array.from({ length: RULES.maxKeywordDocs + 1 }, (_, i) => doc(i, ['xxx', 'yyy', 'zzz']));
  assert.equal(deriveRelations(common, topics).filter((r) => r.predicate === 'sharesKeywordWith').length, 0);

  const hub = doc(0, ['kk1', 'kk2', 'kk3', 'kk4', 'kk5']);
  const others = [1, 2, 3, 4, 5].map((n) => doc(n, ['kk1', 'kk2', 'kk3'].concat(n === 5 ? ['kk4', 'kk5'] : [])));
  const touching = deriveRelations([hub, ...others], topics).filter((r) => r.source_doc_url === 'u0' || r.target_doc_url === 'u0');
  assert.ok(touching.length <= RULES.partnersPerDoc + others.length); // hub keeps its top 3; others may each choose the hub back
  assert.equal(touching.find((r) => r.target_doc_url === 'u5')?.weight, 5);
});

test('R3 ties one hub doc per cluster to its topic, so each topic is one graph', () => {
  const kw = ['aaa', 'bbb', 'ccc'];
  const docs = [doc(1, kw), doc(2, kw), doc(3, kw), doc(4, ['ddd', 'eee', 'fff']), doc(5, ['ddd', 'eee', 'fff'])];
  const rels = deriveRelations(docs, topics);
  const hubs = rels.filter((r) => r.predicate === 'belongsToTopic');
  assert.equal(hubs.length, 2); // two clusters
  const m = graphMetrics(rels.filter((r) => r.topic_id === '1' && r.predicate !== 'isKeywordOf').map((r) => ({ from: r.subject, to: r.object })));
  assert.equal(m.components, 1);
});

test('graphMetrics counts nodes, edges and connected components', () => {
  const m = graphMetrics([{ from: 'a', to: 'b' }, { from: 'b', to: 'c' }, { from: 'x', to: 'y' }]);
  assert.deepEqual([m.nodes, m.edges, m.components, m.edgesPerNode], [5, 3, 2, 0.6]);
});
