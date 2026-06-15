import { chromium } from 'playwright';
import seedData from '../seed-data.json';

export interface KUMOOCDoc {
  source: 'KU_MOOC';
  title: string;
  abstract?: string;
  authors: string[];
  url: string;
  topic_ids: string[];
  bcg_pillars: string[];
  keywords: string[];
  search_keyword: string;
  doc_type: 'course';
  course_code?: string;
  category?: string;
  indexed_at: string;
}

const topicBCGMap = new Map<string, string[]>(
  seedData.topics.map((t) => [t.id, t.bcg_pillars]),
);

// BCG topic keyword patterns for auto-assigning topic_ids to discovered courses
function guessTopics(text: string): string[] {
  const s = text.toLowerCase();
  const map: { p: RegExp; t: string }[] = [
    { p: /biomass|bioenergy|biodiesel|ethanol|ชีวมวล|พลังงานชีวภาพ|ก๊าซชีวภาพ/, t: '1' },
    { p: /chitosan|ไคโตซาน|packaging|บรรจุภัณฑ์|bioplastic/, t: '2' },
    { p: /microplastic|ไมโครพลาสติก|water quality|คุณภาพน้ำ/, t: '3' },
    { p: /carbon|คาร์บอน|greenhouse|climate|ก๊าซเรือนกระจก|โลกร้อน/, t: '4' },
    { p: /aquaculture|probiotic|fish|ปลา|เพาะเลี้ยงสัตว์น้ำ|กุ้ง/, t: '5' },
    { p: /biodiversity|ecology|agroforestry|วนเกษตร|ความหลากหลาย|ป่าไม้/, t: '6' },
  ];
  const matched = map.filter(({ p }) => p.test(s)).map(({ t }) => t);
  return matched.length > 0 ? matched : [];
}

async function scrapeCourseById(
  courseId: number,
  knownTopicIds?: string[],
  courseCode?: string,
  category?: string,
): Promise<KUMOOCDoc | null> {
  const url = `https://kumooc.ku.th/courses/${courseId}/info`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    // 404 or redirect to home means course doesn't exist
    if (!resp || resp.status() === 404) return null;
    await page.waitForTimeout(2000);

    // Check if page actually has course content
    const hasContent = await page.locator('h1, h2, [class*="title"]').count();
    if (!hasContent) return null;

    const data = await page.evaluate(() => {
      // Title — course-title class is the reliable selector (not h2 which grabs chapter names)
      const titleEl = document.querySelector('[class*="course-title"], [class*="CourseTitle"], [class*="course-name"]');
      const title = titleEl?.textContent?.trim() || document.title.replace(/\|.*$/, '').trim();

      // Description — the "รายละเอียด" tab content (first tab, default)
      const descEl = document.querySelector(
        '[class*="description"], [class*="about"], [class*="detail"], [class*="content"] p, main p',
      );
      const abstract = descEl?.textContent?.trim()?.slice(0, 800);

      // Instructor
      const instructorEl = document.querySelector(
        '[class*="instructor"], [class*="teacher"], [class*="author"], [class*="Instructor"]',
      );
      const instructor = instructorEl?.textContent?.trim();

      // Course code (e.g. kumooc005 shown on page)
      const codeEl = document.querySelector('[class*="code"], [class*="Code"]');
      const code = codeEl?.textContent?.trim();

      // Category tags
      const tags = Array.from(document.querySelectorAll('[class*="tag"], [class*="category"], [class*="subject"]'))
        .map((el) => el.textContent?.trim() || '')
        .filter(Boolean)
        .slice(0, 5);

      return { title, abstract, instructor, code, tags };
    });

    if (!data.title || data.title.length < 3) return null;

    const fullText = `${data.title} ${data.abstract || ''} ${data.tags?.join(' ') || ''}`;
    const topicIds = knownTopicIds?.length ? knownTopicIds : guessTopics(fullText);
    if (topicIds.length === 0) return null; // not BCG-relevant

    const bcgPillars = [...new Set(topicIds.flatMap((id) => topicBCGMap.get(id) ?? []))];

    return {
      source: 'KU_MOOC',
      title: data.title,
      abstract: data.abstract,
      authors: data.instructor ? [data.instructor] : [],
      url,
      topic_ids: topicIds,
      bcg_pillars: bcgPillars,
      keywords: data.tags || [],
      search_keyword: courseCode || data.code || '',
      doc_type: 'course',
      course_code: courseCode || data.code,
      category,
      indexed_at: new Date().toISOString(),
    };
  } catch (err) {
    const msg = (err as Error).message;
    if (!msg.includes('timeout') && !msg.includes('Navigation')) {
      console.warn(`  KU MOOC id=${courseId}: ${msg.slice(0, 60)}`);
    }
    return null;
  } finally {
    await browser.close();
  }
}

export async function scrapeKUMOOC(): Promise<KUMOOCDoc[]> {
  const allDocs: KUMOOCDoc[] = [];
  const seen = new Set<string>();

  console.log('KU MOOC: scraping courses from seed data...');
  for (const course of seedData.ku_mooc_courses) {
    const courseId = parseInt(course.url.match(/\/courses\/(\d+)/)?.[1] || '0');
    if (!courseId) continue;
    const doc = await scrapeCourseById(courseId, course.topic_ids, course.code, course.category);
    if (doc && !seen.has(doc.url)) {
      seen.add(doc.url);
      allDocs.push(doc);
      console.log(`  ✓ [${courseId}] ${doc.title.slice(0, 55)}`);
    }
  }

  console.log(`KU MOOC: ${allDocs.length} BCG-relevant courses`);
  return allDocs;
}
