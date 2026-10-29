import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { buildNonDegreeDocs, buildNonDegreeTriples, type NonDegreeCourse } from './non-degree';

const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const courses: NonDegreeCourse[] = read('data/non-degree-courses.json');
const { topics } = read('seed-data.json');
const NOW = new Date('2026-10-29T00:00:00Z');
const docs = buildNonDegreeDocs(courses, topics, NOW);
const byTitle = (t: string) => docs.find((d) => d.title === t)!;

test('every course in the file becomes a document, whatever its relevance level', () => {
  assert.equal(docs.length, 19);
  assert.ok(docs.every((d) => d.source === 'KU_NonDegree' && d.doc_type === 'course'));
});

test('topic ids and BCG pillars follow the mapping', () => {
  const carbon = byTitle('วิทยากรกระบวนการความเป็นกลางทางคาร์บอนภาคการเกษตร');
  assert.deepEqual(carbon.topic_ids, ['4']);
  assert.deepEqual(carbon.bcg_pillars, ['Green']);
  assert.deepEqual(byTitle('การผลิตและเพิ่มมูลค่าสัตว์น้ำจืดเศรษฐกิจ').topic_ids, ['2', '5']);
});

test('cross-topic courses are attached to all six topics', () => {
  const cross = docs.filter((d) => d.topic_ids.length === 6);
  assert.equal(cross.length, 3);
  for (const d of cross) assert.deepEqual(d.topic_ids, ['1', '2', '3', '4', '5', '6']);
});

test('every url is its own course page, never the course list', () => {
  const urls = docs.map((d) => d.url);
  assert.equal(new Set(urls).size, 19);
  assert.ok(!urls.includes('https://sis.ku.ac.th/coursenondegree/'));
  assert.equal(byTitle('ชุดวิชาเกษตรนวัตกรเพื่อการพัฒนาอย่างยั่งยืน').url, 'https://sis.ku.ac.th/agricultural-innovator/');
});

test('documents carry no description or authors, and a stable indexed_at', () => {
  for (const d of docs) {
    assert.ok(!('abstract' in d));
    assert.deepEqual(d.authors, []);
    assert.equal(d.indexed_at, NOW.toISOString());
  }
});

test('one isCourseFor triple per course-topic pair', () => {
  const triples = buildNonDegreeTriples(courses, topics);
  assert.equal(triples.length, 40);
  assert.ok(triples.every((t) => t.predicate === 'isCourseFor'));
  assert.ok(triples.some((t) => t.object === 'Carbon Footprint & Carbon Neutrality' && t.topic_id === '4'));
});
