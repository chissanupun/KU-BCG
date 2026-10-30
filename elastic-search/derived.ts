/** Relations computed from document metadata with fixed rules (origin "derived"), as opposed to the hand-curated ones. */

export interface DerivDoc { title: string; url: string; keywords: string[]; topic_ids: string[] }
export interface DerivTopic { id: string; name_en: string }
export interface DerivedTriple {
  subject: string; predicate: 'isKeywordOf' | 'sharesKeywordWith' | 'belongsToTopic'; object: string; topic_id: string;
  origin: 'derived'; weight: number; source_doc_url?: string; target_doc_url?: string;
}

/** Thresholds: ponytail, tune after looking at the graph-metrics output. */
export const RULES = {
  keywordMinDocs: 3, // R1: a keyword needs this many docs inside the topic
  keywordTopicShare: 0.5, // R1: and more than this share of all docs carrying it, so "thailand" does not link every topic
  keywordsPerTopic: 8, // R1
  pairMinShared: 3, // R2: keywords two docs must share
  maxKeywordDocs: 30, // R2: ignore keywords more common than this
  partnersPerDoc: 3, // R2: each doc keeps its best partners
};

const norm = (k: string) => k.trim().toLowerCase().replace(/\s+/g, ' ');
const keysOf = (d: DerivDoc) => new Set(d.keywords.map(norm).filter((k) => k.length >= 3));

/** R1: keyword -> topic, for keywords that are characteristic of that topic. */
function keywordToTopic(docs: DerivDoc[], topics: DerivTopic[]): DerivedTriple[] {
  const total = new Map<string, number>();
  const shown = new Map<string, string>();
  for (const d of docs) {
    for (const k of keysOf(d)) total.set(k, (total.get(k) ?? 0) + 1);
    for (const raw of d.keywords) if (!shown.has(norm(raw))) shown.set(norm(raw), raw.trim());
  }
  return topics.flatMap((t) => {
    const inTopic = new Map<string, number>();
    for (const d of docs.filter((x) => x.topic_ids.includes(t.id))) for (const k of keysOf(d)) inTopic.set(k, (inTopic.get(k) ?? 0) + 1);
    return [...inTopic]
      .filter(([k, c]) => c >= RULES.keywordMinDocs && c / total.get(k)! > RULES.keywordTopicShare)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, RULES.keywordsPerTopic)
      .map(([k, c]): DerivedTriple => ({ subject: shown.get(k)!, predicate: 'isKeywordOf', object: t.name_en, topic_id: t.id, origin: 'derived', weight: c }));
  });
}

/** R2: doc <-> doc sharing several specific keywords; each doc keeps its few strongest partners. */
function sharedKeywordPairs(docs: DerivDoc[]): DerivedTriple[] {
  const keys = docs.map(keysOf);
  const index = new Map<string, number[]>();
  keys.forEach((ks, i) => ks.forEach((k) => index.set(k, [...(index.get(k) ?? []), i])));

  const shared = new Map<string, number>();
  for (const members of index.values()) {
    if (members.length > RULES.maxKeywordDocs) continue;
    for (let a = 0; a < members.length; a++) for (let b = a + 1; b < members.length; b++) {
      const key = `${members[a]},${members[b]}`;
      shared.set(key, (shared.get(key) ?? 0) + 1);
    }
  }

  const partners = new Map<number, { other: number; n: number }[]>();
  for (const [key, n] of shared) {
    if (n < RULES.pairMinShared) continue;
    const [a, b] = key.split(',').map(Number);
    partners.set(a, [...(partners.get(a) ?? []), { other: b, n }]);
    partners.set(b, [...(partners.get(b) ?? []), { other: a, n }]);
  }

  const chosen = new Map<string, number>();
  for (const [i, list] of partners) {
    list.sort((x, y) => y.n - x.n || docs[x.other].url.localeCompare(docs[y.other].url));
    for (const { other, n } of list.slice(0, RULES.partnersPerDoc)) chosen.set(`${Math.min(i, other)},${Math.max(i, other)}`, n);
  }

  return [...chosen].map(([key, weight]): DerivedTriple => {
    const [a, b] = key.split(',').map(Number).sort((x, y) => docs[x].url.localeCompare(docs[y].url));
    const common = docs[a].topic_ids.find((id) => docs[b].topic_ids.includes(id));
    return {
      subject: docs[a].title, predicate: 'sharesKeywordWith', object: docs[b].title, topic_id: common ?? docs[a].topic_ids[0],
      origin: 'derived', weight, source_doc_url: docs[a].url, target_doc_url: docs[b].url,
    };
  }).sort((x, y) => x.source_doc_url!.localeCompare(y.source_doc_url!) || x.target_doc_url!.localeCompare(y.target_doc_url!));
}

/**
 * R3: without a link to its topic, every R2 cluster floats on its own. The best-connected doc of each cluster
 * is tied to the topic, which is true of it and keeps one graph per topic without linking every document.
 */
function clusterHubs(pairs: DerivedTriple[], topics: DerivTopic[]): DerivedTriple[] {
  return topics.flatMap((t) => {
    const edges = pairs.filter((p) => p.topic_id === t.id);
    const parent = new Map<string, string>();
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x);
      return parent.get(x) === x ? x : find(parent.get(x)!);
    };
    const degree = new Map<string, { title: string; n: number }>();
    for (const e of edges) {
      parent.set(find(e.source_doc_url!), find(e.target_doc_url!));
      for (const [url, title] of [[e.source_doc_url!, e.subject], [e.target_doc_url!, e.object]]) degree.set(url, { title, n: (degree.get(url)?.n ?? 0) + 1 });
    }
    const hubs = new Map<string, string>();
    for (const [url, { n }] of degree) {
      const root = find(url);
      const best = hubs.get(root);
      if (!best || n > degree.get(best)!.n || (n === degree.get(best)!.n && url < best)) hubs.set(root, url);
    }
    return [...hubs.values()].sort().map((url): DerivedTriple => ({
      subject: degree.get(url)!.title, predicate: 'belongsToTopic', object: t.name_en, topic_id: t.id,
      origin: 'derived', weight: degree.get(url)!.n, source_doc_url: url,
    }));
  });
}

export function deriveRelations(docs: DerivDoc[], topics: DerivTopic[]): DerivedTriple[] {
  const pairs = sharedKeywordPairs(docs);
  return [...keywordToTopic(docs, topics), ...pairs, ...clusterHubs(pairs, topics)];
}
