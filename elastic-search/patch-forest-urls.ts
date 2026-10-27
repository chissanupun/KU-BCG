import fs from 'fs';
import path from 'path';
import { esClient, DOCS_INDEX } from './es-client';
import { scrapeKUForest, parseRows } from './scrapers/ku-forest';

const key = (t: string) => t.slice(0, 80);
const pretty = (v: unknown, ind = ''): string => {
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => `${ind}  ${pretty(x, ind + '  ')}`).join(',\n')}\n${ind}]` : '[ ]';
  if (v && typeof v === 'object') {
    const e = Object.entries(v);
    return e.length ? `{\n${e.map(([k, x]) => `${ind}  ${JSON.stringify(k)} : ${typeof x === 'number' && /^(_score|max_score)$/.test(k) ? x.toFixed(1) : pretty(x, ind + '  ')}`).join(',\n')}\n${ind}}` : '{ }';
  }
  return JSON.stringify(v);
};

const lookup = async (title: string) => {
  await new Promise((r) => setTimeout(r, 1000));
  const r = await fetch(`https://research.ku.ac.th/forest/Search.aspx?keyword=${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(15000) });
  return parseRows(await r.text()).find((x) => key(x.title) === key(title))?.href;
};
const isSearch = (u: string) => /Search\.aspx/i.test(u);

(async () => {
  const fresh = process.env.SKIP_SCRAPE ? new Map<string, string>() : new Map((await scrapeKUForest()).filter((d) => !isSearch(d.url)).map((d) => [key(d.title), d.url]));
  console.log(`scraped ${fresh.size} item URLs`);

  const file = path.join(__dirname, 'data/all_docs.json');
  const dump = JSON.parse(fs.readFileSync(file, 'utf8'));
  let patched = 0;
  const unmatched: string[] = [];
  if (process.env.SYNC_FROM_ES) {
    const forest = dump.hits.hits.filter((h: { _source: { source: string } }) => h._source.source === 'KU_Forest');
    const { docs } = await esClient.mget<{ url: string }>({ index: DOCS_INDEX, ids: forest.map((h: { _id: string }) => h._id) });
    docs.forEach((d, i) => { const u = 'found' in d && d.found ? d._source?.url : undefined; if (u && !isSearch(u)) { forest[i]._source.url = u; patched++; } });
    fs.writeFileSync(file, pretty(dump) + '\n');
    console.log(`synced ${patched}/${forest.length} from ES`);
    return;
  }
  const hits = dump.hits.hits.filter((h: { _source: { source: string; url: string } }) => h._source.source === 'KU_Forest' && isSearch(h._source.url));
  try {
    for (const [i, hit] of hits.entries()) {
      const url = fresh.get(key(hit._source.title)) ?? (await lookup(hit._source.title));
      if (!url) { unmatched.push(hit._source.title); continue; }
      hit._source.url = url;
      patched++;
      await esClient.update({ index: DOCS_INDEX, id: hit._id, doc: { url } }, { ignore: [404] });
      console.log(`  ${i + 1}/${hits.length}`);
    }
  } catch (e) {
    console.error(`stopped on first error, saving progress: ${(e as Error).message}`);
  }
  fs.writeFileSync(file, pretty(dump) + '\n');
  await esClient.indices.refresh({ index: DOCS_INDEX });
  console.log(`patched ${patched}, unmatched ${unmatched.length}`);
  unmatched.slice(0, 10).forEach((t) => console.log('  -', t));
})();
