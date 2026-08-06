"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { RecentSearch } from "./types";
import { useUser } from "./UserContext";

type SearchHistoryContextValue = {
  items: RecentSearch[];
  loading: boolean;
  /** Re-reads /api/search/recent. Stable identity — safe in effect dep arrays. */
  refresh: () => Promise<void>;
  /** Deletes every stored search. Not undoable — callers must confirm first. */
  clear: () => Promise<void>;
};

const SearchHistoryContext = createContext<SearchHistoryContextValue>({
  items: [],
  loading: false,
  refresh: async () => {},
  clear: async () => {},
});

/**
 * Holds the sidebar's recent-search list. Lives at the app root rather than inside
 * Sidebar because /learn has to refresh it after a search creates a new entry.
 */
export function SearchHistoryProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const [items, setItems] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiFetch<{ data: RecentSearch[] }>("/api/search/recent");
      setItems(json.data ?? []);
    } catch {
      // 401 (signed out) and 403 (profile incomplete) are expected states, not failures.
      // The sidebar has no error slot, so an empty list is the correct rendering.
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(async () => {
    // The list is emptied only after the server confirms, so a failed request
    // leaves the sidebar showing what still exists rather than lying about it.
    await apiFetch<{ deleted: number }>("/api/search/recent", { method: "DELETE" });
    setItems([]);
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setItems([]);
      return;
    }
    refresh();
  }, [user, userLoading, refresh]);

  return (
    <SearchHistoryContext.Provider value={{ items, loading, refresh, clear }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  return useContext(SearchHistoryContext);
}
