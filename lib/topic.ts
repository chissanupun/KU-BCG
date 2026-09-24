import type { GraphRagResult } from "./types";
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

/** A node with its coordinates resolved — either from Figma or from the ring layout. */
export type PlacedMapNode = TopicMapNode & { cx: number; cy: number; r: number };

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
const HOURS_CAPTION = "เวลาโดยประมาณทั้งหมด · ตั้งแต่ศูนย์จนถึงระดับมืออาชีพ";
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
 * Fills in coordinates for nodes that have none, on the ellipse the curated map
 * was hand-drawn along, so a computed layout reads the same as the Figma frame.
 */
export function layoutMapNodes(nodes: TopicMapNode[]): PlacedMapNode[] {
  const ring = nodes.length - 1;

  return nodes.map((node, i) => {
    if (node.cx !== undefined && node.cy !== undefined && node.r !== undefined) {
      return node as PlacedMapNode;
    }
    if (i === 0) return { ...node, cx: 303, cy: 205, r: 52 };

    const angle = -Math.PI / 2 + ((i - 1) / Math.max(ring, 1)) * Math.PI * 2;
    return {
      ...node,
      cx: Math.round(303 + 195 * Math.cos(angle)),
      cy: Math.round(205 + 150 * Math.sin(angle)),
      r: 37,
    };
  });
}

/** The curated HTML detail — previously hardcoded inside app/components/TopicDetail.tsx. */
const HTML_SEMANTICS: TopicDetail = {
  badge: "HTML Semantics",
  badgeWidth: 139,
  estimatedHours: `10–15 ${HOURS_UNIT}`,
  hoursCaption: HOURS_CAPTION,
  progress: 82,
  tags: [{ label: "การเขียนโปรแกรม", width: 135 }, { label: "พัฒนาเว็บ", width: 98 }],
  sectionLabel: SECTION_LABEL,
  title: "ความหมายของ HTML",
  summary: "โครงสร้างเว็บ, แท็กความหมาย, พื้นฐานการเข้าถึง",
  body: [
    "HTML ความหมายเชิงความหมาย คือการใช้มาร์กอัป HTML เพื่อเสริมความหมายของข้อมูลในหน้าเว็บและเว็บแอปพลิเคชัน มากกว่าแค่การนำเสนอรูปแบบ",
    `ลองคิดแบบนี้: แท็ก <div> บอกเบราว์เซอร์ว่า "นี่คือกล่อง"`,
  ],
  research: {
    heading: "พื้นฐานงานวิจัย: Bowen (2008):",
    paragraphs: [
      "HTML ความหมายเชิงความหมายช่วยลดภาระทางปัญญา",
      "สำหรับผู้ใช้โปรแกรมอ่านหน้าจอได้ถึง ~40% และปรับปรุงประสิทธิภาพการนำทางอย่างมีนัยสำคัญ",
    ],
  },
  expert: { heading: "ผู้เชี่ยวชาญ / ศาสตราจารย์: ", value: "Jeffrey Zeldman (A Book Apart)" },
  mapTitle: MAP_TITLE,
  mapNodes: [
    { label: "HTML Semantics", color: PRIMARY, cx: 303, cy: 187, r: 52, textColor: "#fff" },
    { label: "Navigation\n& Links", color: "#eab308", cx: 490, cy: 90, r: 38, textColor: "#fff" },
    { label: "Text\nSemantics", color: "#ec4899", cx: 530, cy: 230, r: 36, textColor: "#fff" },
    { label: "Structural\nElements", color: "#84cc16", cx: 460, cy: 340, r: 38, textColor: "#fff" },
    { label: "Forms &\nInputs", color: "#a855f7", cx: 150, cy: 330, r: 38, textColor: "#fff" },
    { label: "ARIA\nRoles", color: "#22c55e", cx: 110, cy: 190, r: 36, textColor: "#fff" },
    { label: "Media &\nTables", color: "#06b6d4", cx: 175, cy: 70, r: 36, textColor: "#fff" },
  ],
  mapEdges: [],
};

/**
 * Details for the curated roadmap's cards, keyed by the `t` query parameter.
 *
 * Only HTML Semantics carries a research citation and expert — those are real
 * attributions and are not invented for the other topics, which render without
 * those blocks rather than with fabricated sources.
 */
export const DEFAULT_TOPICS: Record<string, TopicDetail> = {
  "html-semantics": HTML_SEMANTICS,
  "css-basics": {
    badge: "รากฐาน",
    estimatedHours: `10–15 ${HOURS_UNIT}`,
    hoursCaption: HOURS_CAPTION,
    tags: [{ label: "การเขียนโปรแกรม", width: 135 }, { label: "พัฒนาเว็บ", width: 98 }],
    sectionLabel: SECTION_LABEL,
    title: "พื้นฐาน CSS",
    summary: "บ็อกซ์โมเดล, ตัวเลือก, การต่อเนื่องและความจำเพาะ",
    body: [
      "CSS คือภาษาที่กำหนดว่าเนื้อหา HTML จะถูกแสดงผลอย่างไร — ตั้งแต่ระยะห่าง สี ไปจนถึงการจัดวางทั้งหน้า",
      "บ็อกซ์โมเดลอธิบายว่าทุกองค์ประกอบคือกล่องที่ประกอบด้วยเนื้อหา, padding, border และ margin ซ้อนกันเป็นชั้น",
    ],
    mapTitle: MAP_TITLE,
    mapNodes: [],
    mapEdges: [],
  },
  "color-theory": {
    badge: "หลักการออกแบบภาพ",
    estimatedHours: `10–15 ${HOURS_UNIT}`,
    hoursCaption: HOURS_CAPTION,
    tags: [{ label: "การออกแบบ" }, { label: "ทฤษฎีสี" }],
    sectionLabel: SECTION_LABEL,
    title: "ทฤษฎีสี",
    summary: "จิตวิทยาสี, ความกลมกลืนของสี",
    body: [
      "ทฤษฎีสีอธิบายความสัมพันธ์ระหว่างสีบนวงล้อสี และวิธีจับคู่สีให้เกิดความกลมกลืนแทนการเดาสุ่ม",
      "ความต่างของค่าความสว่างสำคัญกว่าความต่างของเฉดสี เพราะเป็นสิ่งที่กำหนดว่าข้อความจะอ่านออกหรือไม่",
    ],
    mapTitle: MAP_TITLE,
    mapNodes: [],
    mapEdges: [],
  },
  typography: {
    badge: "หลักการออกแบบภาพ",
    estimatedHours: `10–15 ${HOURS_UNIT}`,
    hoursCaption: HOURS_CAPTION,
    tags: [{ label: "การออกแบบ" }, { label: "ตัวอักษร" }],
    sectionLabel: SECTION_LABEL,
    title: "การออกแบบตัวอักษร",
    summary: "ขนาดตัวอักษร, ความอ่านง่าย, การจับคู่ฟอนต์",
    body: [
      "การออกแบบตัวอักษรคือการเลือกและจัดวางฟอนต์เพื่อให้ข้อความอ่านง่ายและสื่อความหมายได้ตรงตามน้ำเสียงที่ต้องการ",
      "ความยาวบรรทัดและระยะห่างระหว่างบรรทัดมีผลต่อความอ่านง่ายมากกว่าการเลือกฟอนต์เสียอีก",
    ],
    mapTitle: MAP_TITLE,
    mapNodes: [],
    mapEdges: [],
  },
};

export const DEFAULT_TOPIC_SLUG = "html-semantics";

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
  const abstract = mod.abstract?.trim() ?? "";
  const condensed = condenseAbstract(abstract, mod.keywords ?? []);
  // KU Forest documents never have an abstract, so their body is the Thai project
  // detail instead of an empty block.
  const body =
    condensed.length > 0 ? condensed : abstract ? [abstract] : projectFacts(mod);
  const bodyFull =
    abstract && condensed.join(" ").length < abstract.length - 40 ? [abstract] : undefined;

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
    tags: (mod.keywords ?? []).slice(0, 4).map((label) => ({ label })),
    sectionLabel: SECTION_LABEL,
    title: mod.title,
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
