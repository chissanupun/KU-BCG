import assert from 'assert';
import fs from 'fs';
import path from 'path';

type Item = { url: string; group: string; title?: string };
const GROUPS = ['KU_Forest', 'KUKR', 'KU_MOOC'];
const UA = 'KU-Phumpanya-linkcheck/1.0';

// dedupe by url, first source wins
const collect = (docs: any, seed: any, laravel = ''): Item[] => {
  const m = new Map<string, Item>();
  const add = (url: string, group: string, title?: string) => url && !m.has(url) && m.set(url, { url, group, title });
  for (const h of docs.hits.hits) add(h._source.url, h._source.source, h._source.title);
  for (const x of seed.ku_forest_search_urls) add(x.url, 'KU_Forest');
  for (const u of Object.values<string>(seed.kukr_urls)) add(u, 'KUKR');
  for (const x of seed.kukr_sample_docs) add(x.url, 'KUKR');
  for (const x of seed.ku_mooc_courses) add(x.url, 'KU_MOOC');
  for (const u of laravel.match(/https?:\/\/[^\s'"<>)]+/g) ?? []) add(u, 'Laravel');
  return [...m.values()];
};

const selftest = () => {
  const docs = { hits: { hits: [
    { _source: { url: 'http://a/Project.aspx?id=1', source: 'KU_Forest', title: 'T' } },
    { _source: { url: 'http://a/Search.aspx?k=x', source: 'KU_Forest', title: 'U' } },
  ] } };
  const seed = {
    ku_forest_search_urls: [{ url: 'http://a/Search.aspx?k=x' }],
    kukr_urls: { search: 'http://k/s', index: 'http://k/s' },
    kukr_sample_docs: [{ url: 'http://k/d' }],
    ku_mooc_courses: [{ url: 'http://m/1' }],
  };
  const items = collect(docs, seed, "'url' => 'https://l/kumooc010', 'x' => 'http://m/1'");
  assert.deepStrictEqual(items.map((i) => i.url), ['http://a/Project.aspx?id=1', 'http://a/Search.aspx?k=x', 'http://k/s', 'http://k/d', 'http://m/1', 'https://l/kumooc010']);
  assert.strictEqual(items[1].group, 'KU_Forest');
  assert.strictEqual(items.filter((i) => /Search\.aspx/i.test(i.url)).length, 1);
  console.log('selftest ok');
};

(async () => {
  const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
  if (process.argv.includes('--selftest')) return selftest();

  const only = arg('only');
  if (only && !GROUPS.includes(only)) throw new Error(`--only must be one of ${GROUPS.join('|')}`);
  const delay = Math.max(1000, Number(arg('delay') ?? 1000));
  const from = Number(arg('from') ?? 0);
  const lv = arg('laravel-seed');
  const read = (f: string) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
  const all = collect(read('data/all_docs.json'), read('seed-data.json'), lv ? fs.readFileSync(lv, 'utf8') : '');
  const items = only ? all.filter((i) => i.group === only) : all;

  let checked = 0, ok = 0;
  let failure: { url: string; reason: string } | undefined;
  const warnings: string[] = [];
  for (let i = from; i < items.length; i++) {
    const { url, group, title } = items[i];
    if (i > from) await new Promise((r) => setTimeout(r, delay));
    checked++;
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': UA } });
      const body = await r.text();
      if (r.status !== 200) { failure = { url, reason: `HTTP ${r.status}` }; break; }
      ok++;
      if (group === 'KU_Forest' && /Project\.aspx/i.test(url) && title && !body.replace(/\s+/g, ' ').includes(title.replace(/\s+/g, ' ').slice(0, 30))) warnings.push(`${url}: title not found in page`);
    } catch (e) {
      failure = { url, reason: String(e) };
      break;
    }
    console.log(`[${i}] 200 ${url}`);
  }

  const report = {
    total: items.length, checked, ok, from, only: only ?? null,
    first_failure: failure ?? null, warnings,
    search_aspx_urls: items.filter((i) => /Search\.aspx/i.test(i.url)).length,
  };
  const base = path.join(__dirname, 'data/results', `link-report-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
  fs.writeFileSync(`${base}.json`, JSON.stringify(report, null, 2));
  fs.writeFileSync(`${base}.md`, [
    '# Link check report', '',
    `- total: ${report.total}`, `- checked: ${checked}`, `- ok: ${ok}`,
    `- URLs with Search.aspx: ${report.search_aspx_urls}`,
    `- first failure: ${failure ? `${failure.url} (${failure.reason})` : 'none'}`,
    `- warnings: ${warnings.length}`, ...warnings.map((w) => `  - ${w}`), '',
  ].join('\n'));
  console.log(JSON.stringify(report, null, 2));
  if (failure) process.exit(1);
})();
