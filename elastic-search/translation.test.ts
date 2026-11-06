import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDocPatch, buildRelationPatch, checkTranslation, sha, type Cache } from './translation';

const meta = { model: 'm', prompt_version: 'v1', translated_at: '2026-10-30', source_lang: 'en' as const, reviewed: false as const };
const entry = (field: string, src: string, th: string) => [sha(src), { field, src, th, model: 'm' }] as const;
const cache: Cache = Object.fromEntries([entry('title', 'Biomass energy', 'พลังงานชีวมวล'), entry('keyword', 'Biomass', 'ชีวมวล'), entry('abstract', 'Yield rose 40%.', 'ผลผลิตเพิ่มขึ้น 40%'), entry('entity', 'fishery', 'ประมง')]);

test('English-only title, abstract and keywords get Thai fields and a stamp listing them', () => {
  const p = buildDocPatch({ title: 'Biomass energy', abstract: 'Yield rose 40%.', keywords: ['Biomass'] }, cache, meta)!;
  assert.deepEqual([p.title_ai_th, p.abstract_ai_th, p.keywords_ai_th], ['พลังงานชีวมวล', 'ผลผลิตเพิ่มขึ้น 40%', ['ชีวมวล']]);
  assert.deepEqual(p.ai_translation?.fields, ['title', 'abstract', 'keywords']);
});

test('text that already has Thai is never translated, even if the cache has an entry', () => {
  assert.equal(buildDocPatch({ title: 'ชีวมวล Biomass energy', keywords: ['ไคโตซาน'] }, cache, meta), null);
});

test('keywords_ai_th lines up with keywords: untranslated and Thai ones keep their own text', () => {
  const p = buildDocPatch({ keywords: ['Biomass', 'ไคโตซาน', 'Unknown term'] }, cache, meta)!;
  assert.deepEqual(p.keywords_ai_th, ['ชีวมวล', 'ไคโตซาน', 'Unknown term']);
});

test('relation entities get subject_th/object_th only for the English side', () => {
  assert.deepEqual(buildRelationPatch({ subject: 'fishery', object: 'Faculty_ประมง' }, cache, meta)?.subject_th, 'ประมง');
  assert.equal(buildRelationPatch({ subject: 'fishery', object: 'Faculty_ประมง' }, cache, meta)?.object_th, undefined);
  assert.equal(buildRelationPatch({ subject: 'ป่าไม้', object: 'ประมง' }, cache, meta), null);
});

test('checks: a missing number is a hard failure; a Latin binomial or a long expansion is only a soft flag', () => {
  assert.deepEqual(checkTranslation('Yield rose 40%.', 'ผลผลิตเพิ่มขึ้น').hard, ['number 40 missing']);
  assert.deepEqual(checkTranslation('x', '').hard, ['empty']);
  assert.deepEqual(checkTranslation('Yield rose 40%.', 'ผลผลิตเพิ่มขึ้น 40%'), { hard: [], soft: [] });
  assert.ok(checkTranslation('Dipterocarpus alatus', 'Dipterocarpus alatus').soft.includes('under 50% Thai letters'));
  assert.deepEqual(checkTranslation('Dipterocarpus alatus', 'ยางนา (Dipterocarpus alatus)').hard, []);
  assert.ok(checkTranslation('GAP', 'แนวทางปฏิบัติทางการเกษตรที่ดี (GAP) สำหรับพืชผล').soft.includes('over 3x the source length'));
});
