import { chromium } from 'playwright';
import seedData from '../seed-data.json';

export interface KUForestDoc {
  source: 'KU_Forest';
  title: string;
  abstract?: string;
  authors: string[];
  year?: number;
  url: string;
  topic_ids: string[];
  bcg_pillars: string[];
  keywords: string[];
  search_keyword: string;
  doc_type: string;
  funding?: string;
  indexed_at: string;
}

function parseRows(html: string): { type: string; title: string; year?: number; pi: string[]; copi: string[]; funding: string }[] {
  const results: { type: string; title: string; year?: number; pi: string[]; copi: string[]; funding: string }[] = [];
  const tdMatches = html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
  for (const [, inner] of tdMatches) {
    const text = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text.match(/^(งานวิจัย|วารสาร|ประชุม|บทความ|ทรัพย์สิน|รางวัล)/)) continue;

    const typeMatch = text.match(/^(งานวิจัย|วารสาร|ประชุม|บทความ|ทรัพย์สินทางปัญญา|รางวัล)/);
    const docType = typeMatch?.[1] || 'research';
    const afterType = text.slice(docType.length).trim();

    const titleMatch = afterType.match(/^(.+?)(?:\s+หัวหน้าโครงการ:|$)/);
    const titleWithYear = titleMatch?.[1]?.trim() || afterType.slice(0, 200);
    const yearMatch = titleWithYear.match(/\((\d{4})\)\s*$/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;
    const title = titleWithYear.replace(/\s*\(\d{4}\)\s*$/, '').trim();

    const piMatch = text.match(/หัวหน้าโครงการ:\s*([^ผ]+?)(?:ผู้ร่วมโครงการ:|แหล่งทุน:|ผลลัพธ์:|$)/);
    const pi = piMatch ? [piMatch[1].trim()] : [];
    const copiMatch = text.match(/ผู้ร่วมโครงการ:\s*([^แ]+?)(?:แหล่งทุน:|ผลลัพธ์:|$)/);
    const copi = copiMatch ? copiMatch[1].split(',').map(s => s.trim()).filter(Boolean) : [];
    const fundingMatch = text.match(/แหล่งทุน:\s*([^ผ]+?)(?:ผลลัพธ์:|$)/);
    const funding = fundingMatch?.[1]?.trim() || '';

    if (title.length > 5) results.push({ type: docType, title, year, pi, copi, funding });
  }
  return results;
}

export async function scrapeKUForest(): Promise<KUForestDoc[]> {
  const allDocs: KUForestDoc[] = [];
  const seen = new Set<string>();
  const topicBCGMap = new Map<string, string[]>(seedData.topics.map((t) => [t.id, t.bcg_pillars]));

  const browser = await chromium.launch({ headless: true });

  for (const entry of seedData.ku_forest_search_urls) {
    const { keyword, url } = entry;
    const topicIds = entry.topic_ids as string[];
    const uniqueTopicIds = [...new Set(topicIds)];
    const bcgPillars = [...new Set(uniqueTopicIds.flatMap((id) => topicBCGMap.get(id) ?? []))];
    const page = await browser.newPage();
    let docsForKeyword = 0;

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(2000);

      for (let pageNum = 1; pageNum <= 3; pageNum++) {
        if (pageNum > 1) {
          const nextLink = page.locator(`a`).filter({ hasText: String(pageNum) }).first();
          if (!(await nextLink.isVisible().catch(() => false))) break;
          await nextLink.click();
          await page.waitForTimeout(2000);
        }

        const html = await page.content();
        const rows = parseRows(html);
        if (rows.length === 0) break;

        for (const row of rows) {
          const key = row.title.slice(0, 80);
          if (seen.has(key)) continue;
          seen.add(key);
          allDocs.push({
            source: 'KU_Forest',
            title: row.title,
            authors: [...row.pi, ...row.copi].slice(0, 5),
            year: row.year,
            url,
            topic_ids: uniqueTopicIds,
            bcg_pillars: bcgPillars,
            keywords: [keyword],
            search_keyword: keyword,
            doc_type: row.type,
            funding: row.funding || undefined,
            indexed_at: new Date().toISOString(),
          });
          docsForKeyword++;
        }
      }

      console.log(`  KU Forest "${keyword}": ${docsForKeyword} docs`);
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes('Timeout')) console.warn(`  KU Forest "${keyword}": ${msg.slice(0, 60)}`);
    } finally {
      await page.close();
    }

    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
  console.log(`KU Forest: ${allDocs.length} unique documents`);
  return allDocs;
}
