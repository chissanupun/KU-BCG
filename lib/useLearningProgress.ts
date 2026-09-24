"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api";
import { useUser } from "./UserContext";
import type { LearningProgressState } from "./types";

/**
 * What the roadmap components need to render and record progress. Narrower than
 * the hook's return value so a component cannot depend on fetch internals.
 */
export type RoadmapProgress = {
  percent?: number;
  completedCount: number;
  total: number;
  done: (phase: number, card: number) => boolean;
  toggle: (phase: number, card: number) => void;
};

/**
 * Completion state for one stored roadmap, shared by /learn and /topic.
 *
 * Both pages address a module by the (phase, card) pair already in the card's
 * href, so the roadmap and any one of its detail pages read and write the same
 * rows — ticking a module off in the detail view moves the roadmap's bar.
 *
 * Only rows the user owns have progress: `historyId` undefined (the curated
 * roadmap, or a logged-out visitor) returns a disabled, read-only state.
 */
export function useLearningProgress(historyId?: number) {
  const { user, loading: userLoading } = useUser();

  const [state, setState] = useState<LearningProgressState | null>(null);
  const [saving, setSaving] = useState(false);

  /**
   * Toggles are fire-and-forget from the UI's point of view, so two quick clicks
   * can land out of order. Only the newest response is allowed to set state; the
   * older one would otherwise restore the tick the user just removed.
   */
  const reqSeq = useRef(0);
  const enabled = historyId !== undefined && Boolean(user);

  useEffect(() => {
    if (!enabled || userLoading) {
      setState(null);
      return;
    }

    const seq = ++reqSeq.current;
    apiFetch<{ data: LearningProgressState }>(`/api/search/history/${historyId}/progress`)
      .then((json) => {
        if (reqSeq.current === seq) setState(json.data);
      })
      .catch(() => {
        // Progress is additive to the roadmap: a failure here leaves the track
        // empty rather than replacing the page with an error.
        if (reqSeq.current === seq) setState(null);
      });
  }, [enabled, historyId, userLoading]);

  const done = useCallback(
    (phase: number, card: number) =>
      Boolean(state?.completed.some((m) => m.phase === phase && m.card === card)),
    [state],
  );

  const toggle = useCallback(
    async (phase: number, card: number) => {
      if (!enabled || !state) return;

      const completed = !done(phase, card);
      const next = completed
        ? [...state.completed, { phase, card }]
        : state.completed.filter((m) => !(m.phase === phase && m.card === card));

      const previous = state;
      const seq = ++reqSeq.current;

      // Applied before the request so the tick and the bar move on click; the
      // server response replaces this with the authoritative count.
      setState({
        ...state,
        completed: next,
        completed_count: next.length,
        percent: state.total > 0 ? Math.round((next.length / state.total) * 100) : 0,
      });
      setSaving(true);

      try {
        const json = await apiFetch<{ data: LearningProgressState }>(
          `/api/search/history/${historyId}/progress`,
          { method: "PUT", body: { phase, card, completed } },
        );
        if (reqSeq.current === seq) setState(json.data);
      } catch {
        if (reqSeq.current === seq) setState(previous);
      } finally {
        if (reqSeq.current === seq) setSaving(false);
      }
    },
    [enabled, state, done, historyId],
  );

  return {
    enabled: enabled && state !== null,
    percent: state?.percent,
    completedCount: state?.completed_count ?? 0,
    total: state?.total ?? 0,
    saving,
    done,
    toggle,
  };
}
