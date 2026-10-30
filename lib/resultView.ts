import type { EvidenceItem, GraphRagResult } from "./types";

export const TABS = [
  { key: "overview", label: "ภาพรวม" },
  { key: "map", label: "แผนที่ความรู้" },
  { key: "path", label: "เส้นทางการเรียนรู้" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

/** `?tab=` is user-editable, so anything unknown falls back to the first tab. */
export function parseTab(raw: string | null | undefined): TabKey {
  return TABS.find((t) => t.key === raw)?.key ?? "overview";
}

export const SOURCE_LABELS: Record<EvidenceItem["source"], string> = {
  KU_Forest: "KU Forest",
  KUKR: "KUKR",
  KU_MOOC: "KU MOOC",
  KU_NonDegree: "Non-Degree",
  UNKNOWN: "แหล่งอื่น ๆ",
};

export type ResultTags = { bcgPillars: string[]; faculties: string[] };

const unique = (xs: string[]) => [...new Set(xs.filter(Boolean))];

/**
 * Contract C1: the API sends `tags` once the backend ships it. Results stored
 * before that (and any older deploy) only have `knowledge_graph`, so derive the
 * same lists from node types. Every field is optional — old rows must not throw.
 */
export function resultTags(result: GraphRagResult): ResultTags {
  const graph = result.knowledge_graph;
  const nodes = [...(graph?.center ? [graph.center] : []), ...(graph?.nodes ?? [])];
  const fromGraph = (type: string) => nodes.filter((n) => n.type === type).map((n) => n.label);
  // Each list falls back on its own, so a partial `tags` object loses nothing.
  return {
    bcgPillars: unique(Array.isArray(result.tags?.bcg_pillars) ? result.tags.bcg_pillars : fromGraph("bcg_pillar")),
    faculties: unique(Array.isArray(result.tags?.faculties) ? result.tags.faculties : fromGraph("faculty")),
  };
}

/** Evidence URLs come from scraped data; only plain http(s) may become an href. */
export function safeHref(url: string | undefined | null): string | undefined {
  const trimmed = url?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : undefined;
}
