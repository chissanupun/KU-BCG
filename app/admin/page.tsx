"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppShell from "../components/AppShell";
import {
  adminSearchLogsExportUrl,
  createAdminUser,
  fetchAdminAnalytics,
  fetchAdminSearchLogs,
  fetchAdminStats,
} from "@/lib/adminApi";
import { apiFetch, ApiError } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type {
  AdminAnalytics,
  AdminSearchLogPage,
  AdminStats,
  CreateUserPayload,
} from "@/lib/types";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";
const ROLE_COLORS = ["#3b6347", "#8a9e72", "#c4b5a0", "#5b8a72", "#a3b18a"];

type PeriodMode = "7d" | "30d" | "custom";

function formatDelta(delta: number | null): string {
  if (delta === null) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}% vs ช่วงก่อน`;
}

function KpiCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: number | null;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 160,
        borderRadius: 16,
        background: accent ? PRIMARY : "var(--ku-card-bg)",
        border: accent ? "none" : "0.5px solid var(--ku-card-border)",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, color: accent ? "rgba(255,255,255,0.7)" : "var(--ku-text-muted)" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: accent ? "#fff" : "var(--ku-text)" }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 11, color: accent ? "rgba(255,255,255,0.55)" : "var(--ku-text-faint)" }}>
        {formatDelta(delta)}
      </p>
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [faculties, setFaculties] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as CreateUserPayload["role"],
    faculty: "",
    department: "",
    student_id: "",
    employee_id: "",
    research_affiliation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    apiFetch<{ faculties: string[] }>("/api/reference/faculties")
      .then((r) => setFaculties(r.faculties))
      .catch(() => setFaculties([]));
  }, [open]);

  if (!open) return null;

  const isStudent = form.role === "student";
  const isStaff = form.role === "researcher" || form.role === "teacher" || form.role === "admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const payload: CreateUserPayload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      faculty: form.faculty,
      department: form.department,
      student_id: isStudent ? form.student_id : undefined,
      employee_id: isStaff ? form.employee_id : undefined,
      research_affiliation: form.role === "researcher" ? form.research_affiliation || undefined : undefined,
    };

    try {
      await createAdminUser(payload);
      onCreated();
      onClose();
      setForm({
        name: "",
        email: "",
        password: "",
        role: "student",
        faculty: "",
        department: "",
        student_id: "",
        employee_id: "",
        research_affiliation: "",
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]> };
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(body.errors ?? {})) {
          fieldErrors[field] = messages[0];
        }
        setErrors(fieldErrors);
      } else {
        setFormError("สร้างผู้ใช้ไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    height: 36,
    borderRadius: 8,
    border: "0.5px solid var(--ku-card-border)",
    padding: "6px 10px",
    fontFamily: FONT,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          width: 520,
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: "28px 32px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          fontFamily: FONT,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>สร้างผู้ใช้</h2>

        {(
          [
            ["name", "ชื่อ", "text"],
            ["email", "อีเมล", "email"],
            ["password", "รหัสผ่าน", "password"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>{label}</span>
            <input
              type={type}
              required
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              style={fieldStyle}
            />
            {errors[key] && <span style={{ fontSize: 12, color: "#ff383c" }}>{errors[key]}</span>}
          </label>
        ))}

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>บทบาท</span>
          <select
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as CreateUserPayload["role"] }))
            }
            style={fieldStyle}
          >
            <option value="student">Student</option>
            <option value="researcher">Researcher</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>คณะ</span>
          <select
            required
            value={form.faculty}
            onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))}
            style={fieldStyle}
          >
            <option value="">เลือกคณะ</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          {errors.faculty && <span style={{ fontSize: 12, color: "#ff383c" }}>{errors.faculty}</span>}
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>สาขา / ภาควิชา</span>
          <input
            required
            value={form.department}
            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            style={fieldStyle}
          />
        </label>

        {isStudent && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>รหัสนิสิต</span>
            <input
              required
              value={form.student_id}
              onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
              style={fieldStyle}
            />
            {errors.student_id && (
              <span style={{ fontSize: 12, color: "#ff383c" }}>{errors.student_id}</span>
            )}
          </label>
        )}

        {isStaff && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>รหัสพนักงาน</span>
            <input
              required
              value={form.employee_id}
              onChange={(e) => setForm((f) => ({ ...f, employee_id: e.target.value }))}
              style={fieldStyle}
            />
            {errors.employee_id && (
              <span style={{ fontSize: 12, color: "#ff383c" }}>{errors.employee_id}</span>
            )}
          </label>
        )}

        {form.role === "researcher" && (
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>สังกัดวิจัย</span>
            <input
              value={form.research_affiliation}
              onChange={(e) => setForm((f) => ({ ...f, research_affiliation: e.target.value }))}
              style={fieldStyle}
            />
          </label>
        )}

        {formError && <p style={{ margin: 0, fontSize: 13, color: "#ff383c" }}>{formError}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 8,
              border: "0.5px solid #737373",
              background: "transparent",
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 38,
              padding: "0 18px",
              borderRadius: 8,
              border: "none",
              background: PRIMARY,
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [periodMode, setPeriodMode] = useState<PeriodMode>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [logs, setLogs] = useState<AdminSearchLogPage | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [queryFilter, setQueryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const periodParams = useMemo(() => {
    if (periodMode === "custom") {
      return { period: "custom" as const, from: customFrom, to: customTo };
    }
    return { period: periodMode };
  }, [periodMode, customFrom, customTo]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== "admin") {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const loadDashboard = useCallback(async () => {
    if (periodMode === "custom" && (!customFrom || !customTo)) return;

    setLoadingData(true);
    setError(null);
    try {
      const [s, a] = await Promise.all([
        fetchAdminStats(periodParams),
        fetchAdminAnalytics(periodParams),
      ]);
      setStats(s);
      setAnalytics(a);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        router.replace("/");
        return;
      }
      setError("โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
    } finally {
      setLoadingData(false);
    }
  }, [periodParams, periodMode, customFrom, customTo, router]);

  const loadLogs = useCallback(async () => {
    if (periodMode === "custom" && (!customFrom || !customTo)) return;
    try {
      const data = await fetchAdminSearchLogs({
        ...periodParams,
        role: roleFilter,
        status: statusFilter,
        q: queryFilter || undefined,
        page,
      });
      setLogs(data);
    } catch {
      // keep previous table on soft failure
    }
  }, [periodParams, periodMode, customFrom, customTo, roleFilter, statusFilter, queryFilter, page]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadDashboard();
  }, [user, loadDashboard]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    loadLogs();
  }, [user, loadLogs]);

  if (userLoading || !user || user.role !== "admin") {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT,
          color: "var(--ku-text-muted)",
        }}
      >
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  const exportUrl = adminSearchLogsExportUrl({
    ...periodParams,
    role: roleFilter,
    status: statusFilter,
    q: queryFilter || undefined,
  });

  const cardStyle: React.CSSProperties = {
    borderRadius: 16,
    background: "var(--ku-card-bg)",
    border: "0.5px solid var(--ku-card-border)",
    padding: 20,
    minHeight: 260,
  };

  return (
    <AppShell activeNav="admin" breadcrumb="แดชบอร์ดผู้ดูแล">
      <div style={{ padding: "28px 36px 48px", fontFamily: FONT }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--ku-text)" }}>
            Admin Dashboard
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {(["7d", "30d", "custom"] as PeriodMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPeriodMode(mode)}
                style={{
                  height: 34,
                  padding: "0 14px",
                  borderRadius: 8,
                  border: periodMode === mode ? "none" : "0.5px solid var(--ku-card-border)",
                  background: periodMode === mode ? PRIMARY : "var(--ku-card-bg)",
                  color: periodMode === mode ? "#fff" : "var(--ku-text)",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                {mode === "7d" ? "7 วัน" : mode === "30d" ? "30 วัน" : "กำหนดเอง"}
              </button>
            ))}
            {periodMode === "custom" && (
              <>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{ height: 34, borderRadius: 8, border: "0.5px solid var(--ku-card-border)", padding: "0 8px" }}
                />
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{ height: 34, borderRadius: 8, border: "0.5px solid var(--ku-card-border)", padding: "0 8px" }}
                />
              </>
            )}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 8,
                border: "none",
                background: PRIMARY,
                color: "#fff",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              สร้างผู้ใช้
            </button>
          </div>
        </div>

        {error && (
          <p style={{ color: "#ff383c", marginBottom: 16, fontSize: 13 }}>{error}</p>
        )}

        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          <KpiCard
            label="Total Searches"
            value={loadingData ? "…" : String(stats?.total_searches.value ?? 0)}
            delta={stats?.total_searches.delta_pct ?? null}
            accent
          />
          <KpiCard
            label="Active Users"
            value={loadingData ? "…" : String(stats?.active_users.value ?? 0)}
            delta={stats?.active_users.delta_pct ?? null}
          />
          <KpiCard
            label="Avg. Latency"
            value={loadingData ? "…" : `${Math.round(stats?.avg_latency_ms.value ?? 0)} ms`}
            delta={stats?.avg_latency_ms.delta_pct ?? null}
          />
          <KpiCard
            label="Zero-Result Rate"
            value={loadingData ? "…" : `${stats?.zero_result_rate.value ?? 0}%`}
            delta={stats?.zero_result_rate.delta_pct ?? null}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={cardStyle}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Search Volume Trend</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics?.search_volume_trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Top Searched Topics</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={(analytics?.top_topics ?? []).map((t) => ({
                  ...t,
                  short: t.query.length > 24 ? `${t.query.slice(0, 24)}…` : t.query,
                }))}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="short" width={110} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill={PRIMARY} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>User Roles Breakdown</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics?.role_breakdown ?? []}
                  dataKey="count"
                  nameKey="role"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {(analytics?.role_breakdown ?? []).map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
              {(analytics?.role_breakdown ?? []).map((r, i) => (
                <span key={r.role} style={{ fontSize: 11, color: "var(--ku-text-muted)" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: ROLE_COLORS[i % ROLE_COLORS.length],
                      marginRight: 4,
                    }}
                  />
                  {r.role} ({r.count})
                </span>
              ))}
            </div>
          </div>

          <div style={cardStyle}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600 }}>Top Retrieved Nodes</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(analytics?.top_nodes ?? []).length === 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--ku-text-muted)" }}>ยังไม่มีข้อมูล</p>
              )}
              {(analytics?.top_nodes ?? []).map((node, i) => (
                <div
                  key={node.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: "var(--ku-surface)",
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--ku-text)" }}>
                    {i + 1}. {node.label}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>{node.count} hits</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Search Logs</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input
                value={queryFilter}
                onChange={(e) => {
                  setPage(1);
                  setQueryFilter(e.target.value);
                }}
                placeholder="ค้นหา query..."
                style={{
                  height: 34,
                  width: 160,
                  borderRadius: 8,
                  border: "0.5px solid var(--ku-card-border)",
                  padding: "0 10px",
                  fontSize: 12,
                  fontFamily: FONT,
                }}
              />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setPage(1);
                  setRoleFilter(e.target.value);
                }}
                style={{
                  height: 34,
                  borderRadius: 8,
                  border: "0.5px solid var(--ku-card-border)",
                  padding: "0 8px",
                  fontSize: 12,
                  fontFamily: FONT,
                }}
              >
                <option value="all">Role: All</option>
                <option value="student">Student</option>
                <option value="researcher">Researcher</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                style={{
                  height: 34,
                  borderRadius: 8,
                  border: "0.5px solid var(--ku-card-border)",
                  padding: "0 8px",
                  fontSize: 12,
                  fontFamily: FONT,
                }}
              >
                <option value="all">Status: All</option>
                <option value="success">Success</option>
                <option value="zero_results">Zero Results</option>
                <option value="error">Error</option>
              </select>
              <a
                href={exportUrl}
                style={{
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 14px",
                  borderRadius: 8,
                  background: PRIMARY,
                  color: "#fff",
                  fontSize: 12,
                  textDecoration: "none",
                  fontFamily: FONT,
                }}
              >
                Export CSV
              </a>
            </div>
          </div>

          <div style={{ borderRadius: 12, border: "0.5px solid var(--ku-card-border)", overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 100px 1fr 90px 80px 100px",
                gap: 12,
                padding: "10px 16px",
                background: "var(--ku-surface)",
                borderBottom: "0.5px solid var(--ku-card-border)",
              }}
            >
              {["Timestamp", "Role", "Query", "Nodes", "Latency", "Status"].map((h) => (
                <span key={h} style={{ fontSize: 11, fontWeight: 600, color: "var(--ku-text-muted)" }}>
                  {h}
                </span>
              ))}
            </div>
            {(logs?.data ?? []).map((row, i) => (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 100px 1fr 90px 80px 100px",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom:
                    i < (logs?.data.length ?? 0) - 1 ? "0.5px solid var(--ku-card-border)" : "none",
                  background: "var(--ku-card-bg)",
                  fontSize: 12,
                  color: "var(--ku-text)",
                }}
              >
                <span style={{ color: "var(--ku-text-muted)", fontFamily: "monospace" }}>
                  {new Date(row.created_at).toLocaleString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
                <span>{row.role_snapshot ?? "—"}</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={row.query}
                >
                  {row.query}
                </span>
                <span>{row.total_nodes_found ?? 0}</span>
                <span>{row.total_latency_ms != null ? `${row.total_latency_ms}ms` : "—"}</span>
                <span
                  style={{
                    color:
                      row.status === "success"
                        ? PRIMARY
                        : row.status === "zero_results"
                          ? "#b45309"
                          : "#dc2626",
                    fontWeight: 500,
                  }}
                >
                  {row.status}
                </span>
              </div>
            ))}
            {(logs?.data.length ?? 0) === 0 && (
              <p style={{ margin: 0, padding: 24, textAlign: "center", color: "var(--ku-text-muted)", fontSize: 13 }}>
                ไม่มี search logs ในช่วงนี้
              </p>
            )}
          </div>

          {logs && logs.last_page > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "0.5px solid var(--ku-card-border)",
                  background: "var(--ku-card-bg)",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  fontFamily: FONT,
                  fontSize: 12,
                }}
              >
                Prev
              </button>
              <span style={{ fontSize: 12, color: "var(--ku-text-muted)", lineHeight: "32px" }}>
                {logs.current_page} / {logs.last_page}
              </span>
              <button
                type="button"
                disabled={page >= logs.last_page}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 8,
                  border: "0.5px solid var(--ku-card-border)",
                  background: "var(--ku-card-bg)",
                  cursor: page >= logs.last_page ? "not-allowed" : "pointer",
                  fontFamily: FONT,
                  fontSize: 12,
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          loadDashboard();
          loadLogs();
        }}
      />
    </AppShell>
  );
}
