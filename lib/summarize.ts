import type { LearningModule } from "./types";

/**
 * Turns a corpus record into something a Thai reader can skim.
 *
 * Most KUKR abstracts are several hundred words of English, which is the whole
 * page for a card that carries one. A real Thai précis of that prose needs
 * translation, so it needs the LLM — and when the backend can supply one it
 * arrives as `summary_th` and wins outright (see `thaiGist`).
 *
 * Without it, this file does the two things that are honestly achievable
 * offline: state what the record *is* in Thai, using the fields that are
 * already Thai, and shorten the English prose rather than pretend to translate
 * it. Figures are pulled out separately because numbers read the same in either
 * language — "R2 = 0.8091" is as informative in Thai as in English.
 */

const SOURCE_LABEL: Record<string, string> = {
  KUKR: "งานวิจัย KUKR",
  KU_Forest: "โครงการวิจัย KU Forest",
  KU_MOOC: "คอร์สเรียน KU MOOC",
};

/** Sentences that announce a finding — what a skimming reader actually wants. */
const FINDING_CUES = [
  "result", "results indicate", "results show", "showed", "shows",
  "found", "revealed", "conclusion", "concluded", "suggest",
  "the key", "significantly", "compared", "highest", "optimal",
];

/** Sentences that only restate the framing — first-choice material to drop. */
const FILLER_CUES = [
  "the objective of this study", "the purpose of this study",
  "the aim of this", "this study was conducted", "this research analyzes",
  "this paper presents", "in this study",
];

/**
 * Stand-ins used while splitting: one marks a sentence boundary, the other
 * protects a period that does not end a sentence. Control characters, so they
 * cannot collide with anything an abstract contains.
 */
const BREAK = "\u0001";
const DOT = "\u0002";

/**
 * Measurements and statistics, kept verbatim.
 *
 * These are the parts of an English abstract that survive into a Thai summary
 * unchanged, so they carry disproportionate value: two figures often say more
 * than a translated sentence would.
 */
export function extractFigures(text: string, limit = 4): string[] {
  const patterns = [
    /R\s?2\s?=\s?[\d.]+/gi,           // goodness of fit, written R2 in plain text
    /R²\s?=\s?[\d.]+/g,
    /\b\d+(?:\.\d+)?\s?%/g,           // percentages
    /\b\d[\d,]*(?:[–-]\d[\d,]*)?\s?(?:µm|μm|um|nm|mm|cm|kg|g\/L|mg\/L|ppm|°C)\b/g,
    /\bn\s?=\s?\d[\d,]*/gi,           // sample size
    /\bp\s?[<>=]\s?0?\.\d+/gi,        // significance
  ];

  const seen = new Set<string>();
  const figures: string[] = [];

  for (const pattern of patterns) {
    for (const match of text.match(pattern) ?? []) {
      const value = match.replace(/\s+/g, " ").trim();
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      figures.push(value);
      if (figures.length >= limit) return figures;
    }
  }

  return figures;
}

/** Splits English prose into sentences without tripping on "et al." or "e.g.". */
function sentences(text: string): string[] {
  const guarded = text
    .replace(/\b(et al|e\.g|i\.e|vs|Fig|Dr|Prof|approx)\./gi, `$1${DOT}`)
    .replace(/(\d)\.(\d)/g, `$1${DOT}$2`);

  // Marked rather than split on a lookbehind, which the configured language
  // target does not support.
  return guarded
    .replace(/([.!?])\s+/g, `$1${BREAK}`)
    .split(BREAK)
    .map((s) => s.split(DOT).join(".").trim())
    .filter((s) => s.length > 25);
}

/**
 * The two or three sentences worth reading, in their original order.
 *
 * Scored rather than truncated: the opening sentence of an abstract is usually
 * its framing ("The objective of this study was to…"), so taking the first N
 * would reliably drop the findings and keep the boilerplate.
 */
export function condenseAbstract(text: string, keywords: string[] = [], take = 2): string[] {
  const clean = text.replace(/©[\s\S]*$/, "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const all = sentences(clean);
  if (all.length <= take) return all.length > 0 ? all : [clean];

  const terms = keywords
    .map((k) => k.toLowerCase().trim())
    .filter((k) => k.length > 3);

  const scored = all.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    let score = 0;

    if (FINDING_CUES.some((cue) => lower.includes(cue))) score += 3;
    if (FILLER_CUES.some((cue) => lower.includes(cue))) score -= 2;

    score += Math.min(extractFigures(sentence, 3).length, 3) * 1.5;
    score += terms.filter((term) => lower.includes(term)).length * 0.8;

    // The first sentence still says what the work is about, so it keeps a nudge
    // — enough to win ties, not enough to outrank a sentence full of results.
    if (index === 0) score += 1;
    // Trailing sentences are often funding or copyright remnants.
    if (index === all.length - 1) score -= 0.5;

    return { sentence, index, score };
  });

  return scored
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);
}

/**
 * The Thai project details, as body paragraphs.
 *
 * KU Forest publishes no abstract, so a card from that source would otherwise
 * render an empty body under its heading. These are the facts its project page
 * does carry, and they are already Thai — no summarising involved. The research
 * team is deliberately left out: the research block further down the page
 * already lists it, and repeating eight names would read as a duplicate.
 */
export function projectFacts(mod: LearningModule): string[] {
  const lines: string[] = [];

  const nature = [
    mod.category?.trim() ? `ประเภทโครงการ: ${mod.category.trim()}` : "",
    mod.project_nature?.trim() ? `ลักษณะโครงการ: ${mod.project_nature.trim()}` : "",
  ].filter(Boolean);
  if (nature.length > 0) lines.push(nature.join(" · "));

  const budget = mod.budget_year?.trim();
  if (budget) lines.push(`ปีงบประมาณ: ${budget}`);

  const funder = [
    mod.funding?.trim() ? `แหล่งทุน: ${mod.funding.trim()}` : "",
    mod.department?.trim() ? `หน่วยงาน: ${mod.department.trim()}` : "",
  ].filter(Boolean);
  if (funder.length > 0) lines.push(funder.join(" · "));

  return lines;
}

function joinThai(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names[0]} และคณะ`;
}

/**
 * One or two Thai sentences saying what this record is.
 *
 * Built from the fields that are already Thai — the topic name, the title (Thai
 * for most KUKR records since the title backfill), the source and the year — so
 * nothing here is a machine translation of the abstract. `summary_th` from the
 * backend replaces it wholesale when present.
 */
export function thaiGist(mod: LearningModule, topicName?: string): string {
  const summaryTh = (mod as { summary_th?: string }).summary_th?.trim();
  if (summaryTh) return summaryTh;

  const label = SOURCE_LABEL[mod.source ?? ""] ?? "งานวิจัย";
  const year = mod.year?.trim();
  const topic = topicName?.trim();
  const authors = joinThai((mod.authors ?? []).filter(Boolean));

  const lead = [
    year ? `${label} ปี ${year}` : label,
    // "ด้าน" runs straight into a Thai word but needs a space before a Latin one.
    topic ? `ด้าน${/^[฀-๿]/.test(topic) ? "" : " "}${topic}` : "",
    authors ? `โดย ${authors}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const keywords = (mod.keywords ?? []).filter(Boolean).slice(0, 3);
  const figures = extractFigures(mod.abstract ?? "", 3);

  const detail = [
    keywords.length > 0 ? `เนื้อหาเน้น ${keywords.join(", ")}` : "",
    figures.length > 0 ? `ตัวเลขสำคัญ: ${figures.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return [lead, detail].filter(Boolean).join("\n");
}
