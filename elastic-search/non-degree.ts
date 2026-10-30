/** KU Non-Degree courses (sis.ku.ac.th) as a fourth source: pure conversion to ES documents and relation triples. */

export type Level = 'ตรงที่สุด' | 'สูง' | 'ปานกลาง' | 'ต่ำ (ทางอ้อม)' | 'ข้ามหัวข้อ';
export interface NonDegreeCourse { title: string; url: string; category: string; topics: { id: string; level: Level }[] }
export interface SeedTopic { id: string; name_th: string; name_en: string; bcg_pillars: string[] }

export interface NonDegreeDoc {
  source: 'KU_NonDegree'; doc_type: 'course'; title: string; url: string; category: string;
  authors: []; keywords: []; topic_ids: string[]; bcg_pillars: string[]; topic_names_th: string[]; topic_names_en: string[];
  search_keyword: 'non-degree'; indexed_at: string;
}
export interface NonDegreeTriple { subject: string; predicate: 'isCourseFor'; object: string; topic_id: string }

const topicsOf = (c: NonDegreeCourse, topics: SeedTopic[]) =>
  topics.filter((t) => c.topics.some((x) => x.id === t.id));

/** The site has no course descriptions, so there is no abstract; the level stays in the data file only. */
export function buildNonDegreeDocs(courses: NonDegreeCourse[], topics: SeedTopic[], now = new Date()): NonDegreeDoc[] {
  return courses.map((c) => {
    const own = topicsOf(c, topics);
    return {
      source: 'KU_NonDegree', doc_type: 'course', title: c.title, url: c.url, category: c.category,
      authors: [], keywords: [],
      topic_ids: own.map((t) => t.id),
      bcg_pillars: [...new Set(own.flatMap((t) => t.bcg_pillars))].sort(),
      topic_names_th: own.map((t) => t.name_th),
      topic_names_en: own.map((t) => t.name_en),
      search_keyword: 'non-degree', indexed_at: now.toISOString(),
    };
  });
}

export const buildNonDegreeTriples = (courses: NonDegreeCourse[], topics: SeedTopic[]): NonDegreeTriple[] =>
  courses.flatMap((c) => topicsOf(c, topics).map((t) => ({ subject: c.title, predicate: 'isCourseFor' as const, object: t.name_en, topic_id: t.id })));
