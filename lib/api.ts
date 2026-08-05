export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

let csrfReady: Promise<void> | null = null;

/** Laravel Sanctum SPA auth: fetch XSRF-TOKEN cookie once before any state-changing request. */
export function ensureCsrfCookie(): Promise<void> {
  if (!csrfReady) {
    csrfReady = fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: "include" }).then(() => undefined);
  }
  return csrfReady;
}

/**
 * Drops the memoized token so the next state-changing request re-fetches it.
 *
 * Laravel expires sessions after `SESSION_LIFETIME` (120 min) and issues a fresh
 * one; a long-lived SPA tab would otherwise keep sending the retired token and
 * get 419 on every write until a full reload.
 */
export function resetCsrfCookie(): void {
  csrfReady = null;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}, retriedCsrf = false): Promise<T> {
  const method = options.method ?? "GET";

  if (method !== "GET") {
    await ensureCsrfCookie();
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (method !== "GET") {
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) headers["X-XSRF-TOKEN"] = xsrf;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  // 419 means the session rotated under us. Re-fetch the token and replay once —
  // the request never reached the controller, so there is nothing to duplicate.
  if (res.status === 419 && method !== "GET" && !retriedCsrf) {
    resetCsrfCookie();
    await ensureCsrfCookie();
    return apiFetch<T>(path, options, true);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, (data as { message?: string })?.message ?? res.statusText, data);
  }

  return data as T;
}

export function googleLoginUrl(): string {
  return `${API_URL}/auth/google`;
}
