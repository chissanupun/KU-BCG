import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toRelations, type Context, type Proposal } from './ai-relations';

const ctx: Context = {
  topics: [{ id: '1', name_th: 'ชีวมวล', name_en: 'Biomass & Bioenergy', faculties: ['เกษตร'] }],
  docs: [{ title: 'Paper A', url: 'u/a' }, { title: 'คอร์ส B', url: 'u/b' }],
  concepts: [{ id: 'sugarcane_residue', name_th: 'ใบอ้อย', name_en: 'x', topic_id: '1' }],
  predicates: ['studiedBy', 'isFeedstockOf'],
  curated: [{ subject: 'Biomass', predicate: 'isKeywordOf', object: 'AGRIS_Q' }],
};
const p = (o: Partial<Proposal>): Proposal => ({ subject: 'sugarcane_residue', subject_type: 'concept', predicate: 'studiedBy', object: 'Paper A', object_type: 'research', object_url: 'u/a', topic_id: '1', origin: 'ai_suggested', confidence: 0.8, reason_th: 'r', ...o });

test('entities are named like the curated relations: topic by English name, documents by title with their url', () => {
  const { relations } = toRelations([p({ predicate: 'isFeedstockOf', object: 'ชีวมวล', object_type: 'topic', object_url: undefined }), p({})], ctx);
  assert.deepEqual(relations.map((r) => [r.subject, r.object, r.target_doc_url]), [['sugarcane_residue', 'Biomass & Bioenergy', undefined], ['sugarcane_residue', 'Paper A', 'u/a']]);
});

test('a document is found by url even when the proposal spells the title differently', () => {
  assert.equal(toRelations([p({ object: 'paper a (typo)' })], ctx).relations[0].object, 'Paper A');
});

test('concepts already used by curated relations are allowed; faculties come from the seed topics', () => {
  const { relations, dropped } = toRelations([p({ subject: 'Biomass', object: 'Faculty_เกษตร', object_type: 'faculty', object_url: undefined }), p({ object: 'Faculty_ประมง', object_type: 'faculty', object_url: undefined })], ctx);
  assert.equal(relations.length, 1);
  assert.match(dropped[0].reason, /unknown faculty/);
});

test('bad drafts are dropped with a reason: unknown predicate/concept/document, self-loop, repeat, bad confidence, wrong origin', () => {
  const reasons = toRelations([
    p({ predicate: 'madeUp' }), p({ subject: 'ghost' }), p({ object_url: 'u/none' }), p({ object: 'sugarcane_residue', object_type: 'concept', object_url: undefined }),
    p({}), p({}), p({ confidence: 1.4, object_url: 'u/b', object: 'คอร์ส B' }), p({ origin: 'curated' }),
  ], ctx).dropped.map((d) => d.reason);
  assert.deepEqual(reasons.map((r) => r.split(' ')[0]), ['unknown', 'unknown', 'no', 'subject', 'already', 'confidence', 'origin']);
});
