"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "./api";
import { useUser } from "./UserContext";
import { useSearchHistory } from "./SearchHistoryContext";
import type { GraphRagResult, SearchHistory, SearchHistoryDetail } from "./types";

export type SearchResultError = { status?: number; message: string };

export function describeError(
  err: unknown,
  /** True when the request was GET /api/search/history/{id} rather than a fresh search. */
  onHistoryPath: boolean,
  profileComplete: boolean,
): SearchResultError {
  if (!(err instanceof ApiError)) return { message: "เกิดข้อผิดพลาดในการค้นหา" };

  if (err.status === 401) {
    return { status: 401, message: "กรุณาเข้าสู่ระบบก่อนค้นหา" };
  }
  // apiFetch already refreshed the token and replayed once, so a surviving 419
  // means the session itself is gone — same remedy as 401, not a raw CSRF error.
  if (err.status === 419) {
    return { status: 401, message: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" };
  }
  if (err.status === 403) {
    // The history route returns 403 for a non-owner too, so a complete profile
    // means this is someone else's (or a deleted) entry — not a profile problem.
    return onHistoryPath && profileComplete
      ? { message: "ไม่พบประวัติการค้นหานี้" }
      : { status: 403, message: "กรุณากรอกข้อมูลโปรไฟล์ให้ครบก่อนค้นหา" };
  }
  if (err.status === 404) {
    return { message: onHistoryPath ? "ไม่พบประวัติการค้นหานี้" : "ฟีเจอร์นี้ backend ยังไม่เปิดใช้งาน" };
  }
  if (err.status === 405) {
    return { status: 405, message: "ฟีเจอร์นี้ backend ยังไม่เปิดใช้งาน" };
  }
  return { status: err.status, message: err.message || "เกิดข้อผิดพลาดในการค้นหา" };
}

type Options = {
  /** Replay a stored result. Wins over `query` — it is the side-effect-free path. */
  historyId?: number;
  /** Run a fresh search. Fires POST /api/search, which creates a row. */
  query?: string;
  /**
   * After a POST creates a row, rewrite the URL to this route with `?h={id}` so
   * reload and back replay the cached result instead of re-running the pipeline.
   * Omit on read-only pages.
   */
  rewriteTo?: string;
};

/**
 * Single owner of the search-result fetch. Both /learn and /topic read through
 * here so the dedupe, supersession and unmount guards below exist once — they are
 * subtle enough that a second copy would drift.
 */
export function useSearchResult({ historyId, query, rewriteTo }: Options) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { refresh: refreshHistory } = useSearchHistory();

  const [result, setResult] = useState<GraphRagResult | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SearchResultError | null>(null);

  /**
   * The request already served, e.g. "q:สาหร่าย" or "h:42". POST /api/search is a
   * pipeline run that writes a row, so it must fire exactly once per query — and
   * once it rewrites the URL to ?h={id}, that key counts as served too.
   */
  const servedKey = useRef<string | null>(null);
  /**
   * Supersedes stale responses. A cleanup-scoped `cancelled` flag can't do this job:
   * React remounts effects in dev, and the remount would discard the very request the
   * dedupe above stops it from re-issuing. Only a newer request invalidates an older one.
   */
  const reqSeq = useRef(0);
  /** A search that resolves after the user has navigated away must not pull them back. */
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!query && historyId === undefined) {
      reqSeq.current++;
      setResult(null);
      setResolvedQuery(undefined);
      setError(null);
      setLoading(false);
      servedKey.current = null;
      return;
    }

    // `h` replays a cached result; `q` re-runs the pipeline. Prefer the cheap path.
    const key = historyId !== undefined ? `h:${historyId}` : `q:${query}`;
    if (servedKey.current === key) return;
    if (userLoading) return;

    if (!user) {
      setLoading(false);
      setError({ status: 401, message: "กรุณาเข้าสู่ระบบก่อนค้นหา" });
      return;
    }

    servedKey.current = key;
    const seq = ++reqSeq.current;
    setLoading(true);
    setError(null);

    const request =
      historyId !== undefined
        ? apiFetch<{ data: SearchHistoryDetail }>(`/api/search/history/${historyId}`).then((json) => ({
            id: json.data.id,
            query: json.data.query,
            result: json.data.result,
            rewrite: false,
          }))
        : apiFetch<{ data: SearchHistory }>("/api/search", { method: "POST", body: { query } }).then((json) => ({
            id: json.data.id,
            query: json.data.query,
            result: json.data.result,
            rewrite: true,
          }));

    request
      .then(({ id, query: storedQuery, result: data, rewrite }) => {
        if (reqSeq.current !== seq) return;
        if (!data) {
          setError({ message: "ไม่พบผลลัพธ์" });
          return;
        }
        setResult(data);
        setResolvedQuery(storedQuery);
        if (rewrite && rewriteTo && alive.current) {
          // A new entry exists now, and `?h=` makes reload/back replay it instead of re-searching.
          servedKey.current = `h:${id}`;
          refreshHistory();
          router.replace(`${rewriteTo}?h=${id}`);
        }
      })
      .catch((err: unknown) => {
        if (reqSeq.current !== seq) return;
        setError(describeError(err, historyId !== undefined, Boolean(user.profile_completed_at)));
      })
      .finally(() => {
        if (reqSeq.current === seq) setLoading(false);
      });
  }, [query, historyId, rewriteTo, user, userLoading, router, refreshHistory]);

  return { result, query: resolvedQuery, loading: loading || userLoading, error };
}
