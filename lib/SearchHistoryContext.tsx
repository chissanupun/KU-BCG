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
};

const SearchHistoryContext = createContext<SearchHistoryContextValue>({
  items: [],
  loading: false,
  refresh: async () => {},
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

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setItems([]);
      return;
    }
    refresh();
  }, [user, userLoading, refresh]);

  return (
    <SearchHistoryContext.Provider value={{ items, loading, refresh }}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  return useContext(SearchHistoryContext);
}
