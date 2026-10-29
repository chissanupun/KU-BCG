"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, UNAUTHORIZED_EVENT } from "./api";
import type { User } from "./types";

type UserContextValue = {
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  /** Replaces the cached user, e.g. with the response of POST /api/consent. */
  applyUser: (user: User | null) => void;
  /** POST /api/logout, then back to the home page (contract C5). */
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
  applyUser: () => {},
  logout: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setUser(await apiFetch<User>("/api/user"));
    } catch {
      // 401 is the normal signed-out answer; any other failure also leaves no usable session.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch {
      // The session may already be gone (401); either way this tab is signed out.
    }
    setUser(null);
    window.location.assign("/");
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Any 401 from /api/* means the session expired: drop the user so pages show the sign-in prompt.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  return <UserContext.Provider value={{ user, loading, refetch, applyUser: setUser, logout }}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
