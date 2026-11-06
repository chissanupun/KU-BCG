import { shownKeywords, shownText } from "./aiTranslation";
import type { AiTranslation, GraphRagResult, KnowledgeGraph } from "./types";
import { condenseAbstract, projectFacts, thaiGist } from "./summarize";

export type TopicMapNode = {
  label: string;
  color: string;
  textColor?: string;
  /** topic | faculty | course | bcg_pillar — drives the type filter and legend. */
  type?: string;
  /** Hand-placed Figma coordinates. Omitted nodes are laid out radially. */
  cx?: number;
  cy?: number;
  r?: number;
};

/** Curated entries carry their Figma width; dynamic ones size to their content. */
export type TopicTag = { label: string; width?: number };

export type TopicDetail = {
  /** Badge above the overview box — the subject the card belongs to. */
  badge: string;
  /** Fixed Figma width for the badge. Omitted when the label length is unknown. */
  badgeWidth?: number;
  estimatedHours: string;
  hoursCaption: string;
  /** 0–100. Undefined when the source cannot supply it — the track renders empty. */
  progress?: number;
  tags: TopicTag[];
  /** Pill left of the section title. */
  sectionLabel: string;
  title: string;
  /** Set when `title`, `body` or `tags` come from an AI Thai translation: the English title, if translated. */
  titleOriginal?: string;
  /** The English abstract, kept behind a fold when `body` is its AI translation. */
  bodyOriginal?: string;
  /** Present exactly when something on this page is AI-translated — drives the badge. */
  aiTranslation?: AiTranslation;
  aiTranslated?: boolean;
  summary: string;
  body: string[];
  /** The untouched source prose, when `body` is a shortened form of it. */
  bodyFull?: string[];
  research?: { heading: string; paragraphs: string[] };
  expert?: { heading: string; value: string };
  /** Source document, shown as a link under the expert line. */
  sourceUrl?: string;
  mapTitle: string;
  /** First entry is the centre node. Empty array hides the whole map section. */
  mapNodes: TopicMapNode[];
  /** Real relations between nodes. Empty for curated topics, which have no triples. */
  mapEdges: TopicMapEdge[];
};

/** A relation triple. `type` is the predicate, e.g. "mitigatesCarbonVia". */
export type TopicMapEdge = { from: string; to: string; type: string };

const PRIMARY = "#3b6347";
const HOURS_UNIT = "ชั่วโมง";
const SECTION_LABEL = "Introduction";
const MAP_TITLE = "แผนที่ความรู้";

/** Ring colours for GraphRAG nodes that arrive without one. */
const NODE_PALETTE = ["#eab308", "#ec4899", "#84cc16", "#a855f7", "#22c55e", "#06b6d4", "#f97316"];

/**
 * Backend phase names arrive as "Phase: Foundation"; the Thai gist reads the
 * subject out of them, so the pipeline's own prefix has to come off first.
 */
function stripPhasePrefix(name: string): string {
  return name.replace(/^phase\s*\d*\s*[:\-–]\s*/i, "").trim() || name;
}

/**
 * The topic page draws the same graph as the result tab. Curated topics carry no
 * relations, only a centre and its spokes, so those are drawn as "related to".
 */
export function toKnowledgeGraph(nodes: TopicMapNode[], edges: TopicMapEdge[]): KnowledgeGraph {
  const flat = (label: string) => label.replace(/\s*\n\s*/g, " ");
  const node = (n: TopicMapNode) => ({ label: flat(n.label), color: n.color, type: (n.type ?? "topic") as KnowledgeGraph["center"]["type"] });
  const [center, ...rest] = nodes;
  return {
    center: node(center),
    nodes: rest.map(node),
    edges: edges.length > 0 ? edges : rest.map((n) => ({ from: flat(center.label), to: flat(n.label), type: "relatedTo" })),
  };
}
function formatHours(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  return /[a-zA-Zก-๙]/.test(value) ? value : `${value} ${HOURS_UNIT}`;
}

/**
 * Projects one card of a GraphRAG result onto the detail model.
 *
 * Per-document fields (`abstract`, `authors`, `year`) are preferred so each card
 * opens a different page; the result-wide `overview` is the fallback for the
 * documents that carry no abstract.
 */
export function topicFromGraphRag(
  result: GraphRagResult,
  phaseIndex: number,
  cardIndex: number,
): TopicDetail | null {
  const phase = result.learning_path?.phases?.[phaseIndex];
  const mod = phase?.modules?.[cardIndex];
  if (!phase || !mod) return null;

  const overview = result.overview ?? {};
  const authors = (mod.authors ?? []).filter(Boolean);

  // Strictly per-document. Falling back to the result-wide `overview` here made
  // every card in a phase render the same prose, since 441 of 612 corpus records
  // carry no abstract. The research/expert blocks below are per-document too, so
  // an abstract-less card still differs from its neighbours.
  //
  // What survives is often several hundred words of English, which is the entire
  // page. `body` therefore holds the shortened form and `bodyFull` the original,
  // so the reader chooses when to see all of it.
  const abstractEn = mod.abstract?.trim() ?? "";
  const translatedAbstract = shownText(abstractEn, mod.abstract_ai_th);
  const title = shownText(mod.title, mod.title_ai_th);
  const keywords = shownKeywords(mod.keywords ?? [], mod.keywords_ai_th);
  // An AI abstract is shown whole: the English cue-based shortening below cannot read Thai prose.
  const abstract = translatedAbstract.original ? translatedAbstract.text : abstractEn;
  const condensed = translatedAbstract.original ? [] : condenseAbstract(abstract, mod.keywords ?? []);
  // KU Forest documents never have an abstract, so their body is the Thai project
  // detail instead of an empty block.
  const body =
    condensed.length > 0 ? condensed : abstract ? [abstract] : projectFacts(mod);
  const bodyFull =
    !translatedAbstract.original && abstract && condensed.join(" ").length < abstract.length - 40 ? [abstract] : undefined;

  const attribution = [authors.join(", "), mod.year].filter(Boolean).join(" · ");
  const research = attribution
    ? { heading: `พื้นฐานงานวิจัย: ${mod.source || "KU BCG"}`, paragraphs: [attribution] }
    : overview.research_basis
      ? { heading: "พื้นฐานงานวิจัย:", paragraphs: [overview.research_basis] }
      : undefined;

  const expertValue = authors[0] || overview.expert;

  const graph = result.knowledge_graph;
  const edges = graph?.edges ?? [];

  // Every node is kept — the previous 6-node cap hid most of the graph, and edge
  // endpoints that were cut off left their relations undrawable. The centre is
  // deduplicated because the backend repeats it in `nodes`.
  const seen = new Set<string>();
  const mapNodes: TopicMapNode[] = [];

  if (graph?.center) {
    seen.add(graph.center.label);
    mapNodes.push({
      label: graph.center.label,
      color: graph.center.color || PRIMARY,
      type: graph.center.type,
      textColor: "#fff",
    });
  }

  (graph?.nodes ?? []).forEach((n, i) => {
    if (seen.has(n.label)) return;
    seen.add(n.label);
    mapNodes.push({
      label: n.label,
      color: n.color || NODE_PALETTE[i % NODE_PALETTE.length],
      type: n.type,
      textColor: "#fff",
    });
  });

  // An edge whose endpoint was never listed as a node would otherwise vanish.
  edges.forEach((e) => {
    [e.from, e.to].forEach((label, i) => {
      if (!label || seen.has(label)) return;
      seen.add(label);
      mapNodes.push({ label, color: NODE_PALETTE[(mapNodes.length + i) % NODE_PALETTE.length], textColor: "#fff" });
    });
  });

  return {
    badge: phase.name,
    estimatedHours: formatHours(mod.hours),
    // The generic curated caption would misdescribe a single paper, so the phase's
    // own source breakdown stands in.
    hoursCaption: phase.intro ?? "",
    // GraphRagResult carries no progress signal — left undefined rather than invented.
    progress: undefined,
    tags: keywords.tags.slice(0, 4).map((label) => ({ label })),
    sectionLabel: SECTION_LABEL,
    title: title.text,
    titleOriginal: title.original,
    bodyOriginal: translatedAbstract.original,
    aiTranslated: Boolean(title.original || translatedAbstract.original || keywords.translated),
    aiTranslation: mod.ai_translation,
    // The card's `desc` is a truncation of whichever field already appears below —
    // the abstract as body, or the keywords as tags — so repeating it here would
    // print the same text twice. The Thai gist goes here instead: it is the one
    // line a Thai reader can act on when the body below is English.
    summary: thaiGist(mod, stripPhasePrefix(phase.name)),
    body,
    bodyFull,
    research,
    expert: expertValue ? { heading: "ผู้เชี่ยวชาญ / ศาสตราจารย์: ", value: expertValue } : undefined,
    sourceUrl: mod.url || undefined,
    mapTitle: MAP_TITLE,
    mapNodes: mapNodes.length > 1 ? mapNodes : [],
    mapEdges: edges.map((e) => ({ from: e.from, to: e.to, type: e.type || "relatedTo" })),
  };
}
