"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, ApiError } from "./api";
import type { User } from "./types";

type UserContextValue = {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await apiFetch<User>("/api/user");
      setUser(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return <UserContext.Provider value={{ user, loading, refetch }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
