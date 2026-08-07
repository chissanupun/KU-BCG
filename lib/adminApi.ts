import { API_URL, apiFetch } from "./api";
import type {
  AdminAnalytics,
  AdminSearchLogPage,
  AdminStats,
  CreateUserPayload,
  User,
} from "./types";

export type AdminPeriodParams = {
  period?: "7d" | "30d" | "custom";
  from?: string;
  to?: string;
};

export type SearchLogParams = AdminPeriodParams & {
  role?: string;
  status?: string;
  q?: string;
  page?: number;
};

function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === "all") continue;
    sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

function periodQuery(params: AdminPeriodParams): Record<string, string | undefined> {
  if (params.period === "custom" && params.from && params.to) {
    return { from: params.from, to: params.to };
  }
  return { period: params.period === "30d" ? "30d" : "7d" };
}

export function fetchAdminStats(params: AdminPeriodParams) {
  return apiFetch<AdminStats>(`/api/admin/stats${toQuery(periodQuery(params))}`);
}

export function fetchAdminAnalytics(params: AdminPeriodParams) {
  return apiFetch<AdminAnalytics>(`/api/admin/analytics${toQuery(periodQuery(params))}`);
}

export function fetchAdminSearchLogs(params: SearchLogParams) {
  return apiFetch<AdminSearchLogPage>(
    `/api/admin/search-logs${toQuery({
      ...periodQuery(params),
      role: params.role,
      status: params.status,
      q: params.q,
      page: params.page,
    })}`,
  );
}

export function adminSearchLogsExportUrl(params: SearchLogParams): string {
  return `${API_URL}/api/admin/search-logs/export${toQuery({
    ...periodQuery(params),
    role: params.role,
    status: params.status,
    q: params.q,
  })}`;
}

export function createAdminUser(payload: CreateUserPayload) {
  return apiFetch<User>("/api/admin/users", {
    method: "POST",
    body: payload,
  });
}
