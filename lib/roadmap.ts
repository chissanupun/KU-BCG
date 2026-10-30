import type { GraphRagResult } from "./types";

export type RoadmapCard = {
  title: string;
  hours: string;
  description: string;
  /** Every card opens the shared topic detail page; the source link lives in there. */
  href?: string;
  /** Position in the stored result — how progress addresses this module. */
  cardIndex?: number;
};

export type RoadmapPhase = {
  title: string;
  description: string;
  cards: RoadmapCard[];
  /** Position in the stored result. Undefined on the curated roadmap. */
  phaseIndex?: number;
};

export type Roadmap = {
  title: string;
  /** Badge above the hero card. Falls back to `title` when the source has no distinct topic. */
  topic: string;
  estimatedHours: string;
  description: string;
  /** 0–100. Undefined when the source cannot supply it — the track renders empty. */
  progress?: number;
  phases: RoadmapPhase[];
};

const HOURS_UNIT = "ชั่วโมง";

/**
 * Backend phase names arrive as "Phase: Foundation" — the badge already renders
 * the ordinal, so the prefix would read as "Phase 1 Phase: Foundation".
 */
function stripPhasePrefix(name: string): string {
  return name.replace(/^phase\s*\d*\s*[:\-–]\s*/i, "").trim() || name;
}

function formatHours(raw: string | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return "";
  // Backend sends bare ranges ("90-140") but also pre-unitted strings ("8-12 hrs").
  return /[a-zA-Zก-๙]/.test(value) ? value : `${value} ${HOURS_UNIT}`;
}

/**
 * Projects a GraphRAG search result onto the same model the curated roadmap uses.
 *
 * `query` is what the user typed. Prefer it for the badge: `result.title` is the
 * top retrieved document's heading (Synthesizer.php:23 falls back to the doc title
 * when no LLM synthesis runs), so the badge would otherwise read as a paper title
 * that looks unrelated to the search.
 *
 * `historyId` lets each card address itself on the shared detail page as
 * `/topic?h={id}&p={phase}&c={card}`. Without it the cards render unlinked —
 * there is no stored row to read the detail back from.
 */
export function fromGraphRag(result: GraphRagResult, query?: string, historyId?: number): Roadmap {
  const path = result.learning_path;

  return {
    title: result.title,
    topic: query?.trim() || result.title,
    estimatedHours: formatHours(path?.estimated_hours),
    description: path?.subtitle ?? result.overview?.intro ?? "",
    // The result itself carries no progress — it comes from the user's completions,
    // which RoadmapView reads separately and passes to the track.
    progress: undefined,
    phases: (path?.phases ?? []).map((phase, phaseIndex) => ({
      title: stripPhasePrefix(phase.name),
      description: phase.intro ?? "",
      phaseIndex,
      cards: (phase.modules ?? []).map((mod, cardIndex) => ({
        title: mod.title,
        hours: formatHours(mod.hours),
        description: mod.desc ?? "",
        cardIndex,
        href:
          historyId !== undefined
            ? `/topic?h=${historyId}&p=${phaseIndex}&c=${cardIndex}`
            : undefined,
      })),
    })),
  };
}
