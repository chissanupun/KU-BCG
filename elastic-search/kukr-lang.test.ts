import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isThai, mergeLang, pickLang } from './kukr-lang';

const TH = 'ผลของการใช้ไคโตซานเคลือบไข่';
const EN = 'Effects of chitosan coating on eggs';
const TH_ABS = 'ศึกษาประสิทธิภาพการใช้ไคโตซาน';
const EN_ABS = 'The objective of this study was';

test('isThai: Thai-dominant text only', () => {
  assert.equal(isThai(TH), true);
  assert.equal(isThai(EN), false);
  assert.equal(isThai('Microplastics กับคุณภาพน้ำในระบบนิเวศ'), true); // a Latin word inside a Thai title
  assert.equal(isThai('Chitosan film coating ไคโตซาน'), false); // mostly Latin
  assert.equal(isThai(undefined), false);
});

test('Thai and English both present: Thai displayed, English kept', () => {
  assert.deepEqual(pickLang({ title_th: TH, title_en: EN, abstract_th: TH_ABS, abstract_en: EN_ABS }), {
    title: TH, title_en: EN, abstract: TH_ABS, abstract_en: EN_ABS,
  });
});

test('English only: English displayed, no *_en duplicate', () => {
  assert.deepEqual(pickLang({ title_en: EN, abstract_en: EN_ABS }), { title: EN, abstract: EN_ABS });
});

test('Thai only', () => {
  assert.deepEqual(pickLang({ title_th: TH, abstract_th: TH_ABS }), { title: TH, abstract: TH_ABS });
});

test('Thai title but English-only abstract: title Thai, abstract English (not duplicated into abstract_en)', () => {
  assert.deepEqual(pickLang({ title_th: TH, title_en: EN, abstract_en: EN_ABS }), {
    title: TH, title_en: EN, abstract: EN_ABS,
  });
});

test('a title_th field that is really English is not shown as Thai', () => {
  assert.deepEqual(pickLang({ title_th: EN, title_en: EN }), { title: EN });
});

test('no title at all falls back to the given one', () => {
  assert.equal(pickLang({}, 'Untitled').title, 'Untitled');
});

test('mergeLang never replaces Thai with English, and is idempotent', () => {
  const existing = { title: TH, title_en: EN };
  assert.deepEqual(mergeLang(existing, { title: EN }), { title: TH, title_en: EN });
  const once = mergeLang({ title: EN }, { title: TH, title_en: EN });
  assert.deepEqual(once, { title: TH, title_en: EN });
  assert.deepEqual(mergeLang(once, { title: TH, title_en: EN }), once);
});

test('mergeLang replaces a wrong Thai title (e.g. a proceedings name) with the record\'s own', () => {
  assert.equal(mergeLang({ title: 'ชื่อการประชุมวิชาการ' }, { title: TH }).title, TH);
});

test('swapped fields: Thai in title_en and English in title_th are filed correctly', () => {
  assert.deepEqual(pickLang({ title_th: EN, title_en: TH }), { title: TH, title_en: EN });
});

test('mergeLang: English from an old scrape moves to title_en when Thai replaces it', () => {
  assert.deepEqual(mergeLang({ title: EN }, { title: TH }), { title: TH, title_en: EN });
});
