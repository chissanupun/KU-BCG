import { chromium } from 'playwright';
import seedData from '../seed-data.json';

export interface KUKRDoc {
  source: 'KUKR';
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
  indexed_at: string;
}

interface KUKRItem {
  bibid: string;
  title_advanced?: string | string[];
  title_en?: string;
  title_th?: string;
  author?: string[];
  keyword?: string[];
  abstract_en?: string;
  abstract_th?: string;
  pubyear?: number;
  pubyear_text?: string;
  biblio_type_name?: string;
}

// Known-good request body structure (captured from live browser session)
const BODY_TEMPLATE = {
  query: {
    command: {
      stext: '',
      inresult: '',
      soption: 'all',
      site_id: '66',
      type_page: 'search',
      like_search: false,
      boolean_search: 0,
      queryAdv: [
        { cond: 'and', main: '', option: 'all', like_search: false },
        { cond: 'and', main: '', option: 'all', like_search: false },
      ],
      optionSet: {
        has_fulltext: 0,
        has_ebook: 0,
        pubyear_range: { start: '', end: '' },
        language: 'all',
        biblio_content_type: '',
        biblio_type_id: '',
        biblio_agris_code: '',
        agrovoc: {
          agrovoc_id: [],
          agrovoc_name_th: [],
          agrovoc_name_th_url: [],
          agrovoc_name_en: [],
          agrovoc_name_en_url: [],
          agrovoc_cond: [],
        },
        serial_title: '',
        vol: '',
        no: '',
      },
    },
    filter: { data: {}, filter_include: true },
    aggregate: true,
    per_page: 50,
    sort: 'new',
  },
  search: '',
};

const KUKR_BASE = 'https://kukr.lib.ku.ac.th';

async function getSessionCookies(): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${KUKR_BASE}/KUKR/Search`, {
      waitUntil: 'networkidle',
      timeout: 25000,
    });
    await page.waitForTimeout(2000);

    // Dismiss modal to get modalClosedKUKR=true cookie
    const outerBtn = page.locator('button').filter({ hasText: /บุคคลภายนอก/ }).first();
    if (await outerBtn.isVisible().catch(() => false)) {
      await outerBtn.click();
      await page.waitForTimeout(1500);
      await page.locator('#th_function_11').click().catch(() => {});
      await page.locator('#th_function_15').click().catch(() => {});
      await page.waitForTimeout(300);
      await page.locator('button').filter({ hasText: /เข้าสู่เว็บไซต์/ }).first().click().catch(() => {});
      await page.waitForTimeout(2000);
    }

    const cookies = await context.cookies();
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  } finally {
    await browser.close();
  }
}

async function fetchPage(
  cookieStr: string,
  keyword: string,
  pageNum: number,
): Promise<{ total: number; list: KUKRItem[] } | null> {
  const body = JSON.parse(JSON.stringify(BODY_TEMPLATE));
  body.query.command.stext = keyword;

  const resp = await fetch(`${KUKR_BASE}/KUKR/Search/find/${pageNum}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json, text/plain, */*',
      'origin': KUKR_BASE,
      'referer': `${KUKR_BASE}/KUKR/Search/index`,
      'x-requested-with': 'XMLHttpRequest',
      'cookie': cookieStr,
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) return null;
  return resp.json() as Promise<{ total: number; list: KUKRItem[] }>;
}

export async function scrapeKUKR(): Promise<KUKRDoc[]> {
  const allDocs: KUKRDoc[] = [];
  const seen = new Set<string>();
  const topicBCGMap = new Map<string, string[]>(seedData.topics.map((t) => [t.id, t.bcg_pillars]));

  console.log('KUKR: Getting session cookies via browser...');
  let cookieStr: string;
  try {
    cookieStr = await getSessionCookies();
    console.log('KUKR: Session ready');
  } catch (err) {
    console.warn(`KUKR: Failed to get session: ${(err as Error).message}`);
    return [];
  }

  // Build keyword → topic mapping
  const keywordTopics: { keyword: string; topicIds: string[] }[] = [];
  for (const topic of seedData.topics) {
    for (const kw of topic.kukr_keywords) {
      const existing = keywordTopics.find((k) => k.keyword === kw);
      if (existing) existing.topicIds.push(topic.id);
      else keywordTopics.push({ keyword: kw, topicIds: [topic.id] });
    }
  }

  for (const { keyword, topicIds } of keywordTopics) {
    const uniqueTopicIds = [...new Set(topicIds)];
    const bcgPillars = [...new Set(uniqueTopicIds.flatMap((id) => topicBCGMap.get(id) ?? []))];
    const docsForKeyword: KUKRDoc[] = [];

    // Register keyword server-side (form POST — mirrors browser Enter key behavior)
    try {
      await fetch(`${KUKR_BASE}/KUKR/Search/index`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'origin': KUKR_BASE,
          'referer': `${KUKR_BASE}/KUKR/Search`,
          'cookie': cookieStr,
          'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: `command%5Bstext%5D=${encodeURIComponent(keyword)}`,
        signal: AbortSignal.timeout(10000),
      });
    } catch {}

    // Get first page + total
    let firstData: { total: number; list: KUKRItem[] } | null = null;
    try {
      firstData = await fetchPage(cookieStr, keyword, 0);
    } catch (err) {
      console.warn(`  KUKR "${keyword}": first page failed — ${(err as Error).message.slice(0, 60)}`);
      continue;
    }

    if (!firstData || !firstData.total) {
      console.warn(`  KUKR "${keyword}": no results (status may have been non-200)`);
      continue;
    }

    console.log(`  KUKR "${keyword}": ${firstData.total} results`);

    const processItems = (items: KUKRItem[]) => {
      for (const item of items) {
        if (seen.has(item.bibid)) continue;
        seen.add(item.bibid);
        const rawTitle = item.title_advanced || item.title_en || item.title_th || 'Untitled';
        const title = Array.isArray(rawTitle)
          ? (rawTitle.find((t) => /[a-zA-Z]/.test(t)) || rawTitle[0])
          : rawTitle;
        const doc: KUKRDoc = {
          source: 'KUKR',
          title,
          abstract: item.abstract_en || item.abstract_th,
          authors: item.author || [],
          year: item.pubyear || (item.pubyear_text ? parseInt(item.pubyear_text) : undefined),
          url: `${KUKR_BASE}/KUKR/Search/detail/${item.bibid}`,
          topic_ids: uniqueTopicIds,
          bcg_pillars: bcgPillars,
          keywords: item.keyword || [],
          search_keyword: keyword,
          doc_type: item.biblio_type_name || 'research',
          indexed_at: new Date().toISOString(),
        };
        allDocs.push(doc);
        docsForKeyword.push(doc);
      }
    };

    processItems(firstData.list || []);

    const totalPages = Math.min(Math.ceil(firstData.total / 50), 20);
    for (let pageNum = 1; pageNum < totalPages; pageNum++) {
      // 500ms between pages, extra 1s every 5 pages
      await new Promise((r) => setTimeout(r, pageNum % 5 === 0 ? 1500 : 500));
      let data: { total: number; list: KUKRItem[] } | null = null;
      try {
        data = await fetchPage(cookieStr, keyword, pageNum);
      } catch (err) {
        console.warn(`  KUKR "${keyword}": page ${pageNum} failed — ${(err as Error).message.slice(0, 50)}, stopping`);
        break;
      }
      if (!data?.list?.length) break;
      processItems(data.list);
    }

    console.log(`  KUKR "${keyword}": ${docsForKeyword.length} docs added`);
    // 2s cooldown between keywords
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`KUKR: ${allDocs.length} unique documents total`);
  return allDocs;
}
