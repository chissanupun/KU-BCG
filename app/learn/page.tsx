"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLoginUrl } from "@/lib/api";
import { useSearchResult } from "@/lib/useSearchResult";
import { fromGraphRag } from "@/lib/roadmap";
import AppShell from "../components/AppShell";
import LearnResultView from "./LearnResultView";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim();
  const rawHistoryId = searchParams.get("h")?.trim();
  const historyId = rawHistoryId && /^\d+$/.test(rawHistoryId) ? Number(rawHistoryId) : undefined;

  const { result, query, loading, error } = useSearchResult({
    historyId,
    query: historyId === undefined ? q : undefined,
    rewriteTo: "/learn",
  });

  const roadmap = useMemo(
    () => (result ? fromGraphRag(result, query, historyId) : null),
    [result, query, historyId],
  );

  const breadcrumb = query
    ? `หน้าแรก > ค้นหา > ${query}`
    : "หน้าแรก > ค้นหา";

  if (!q && historyId === undefined) {
    return (
      <AppShell activeNav="search" breadcrumb="หน้าแรก > ค้นหา">
        <div style={{ padding: 48, fontFamily: FONT, color: "var(--ku-text-muted)" }}>
          ยังไม่มีการค้นหา —{" "}
          <button
            onClick={() => router.push("/")}
            style={{ color: PRIMARY, textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: FONT }}
          >
            เริ่มค้นหาใหม่
          </button>
        </div>
      </AppShell>
    );
  }

  if (loading) {
    return (
      <AppShell activeNav="search" breadcrumb={breadcrumb}>
        <div style={{ padding: 48, fontFamily: FONT, color: "var(--ku-text-muted)" }}>
          กำลังค้นหา...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell activeNav="search" breadcrumb={breadcrumb}>
        <div style={{ padding: 48, fontFamily: FONT }}>
          <p style={{ color: "#dc2626" }}>{error.message}</p>
          {error.status === 401 && (
            <button
              onClick={() => {
                window.location.href = googleLoginUrl();
              }}
              className="hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ marginTop: 12, background: PRIMARY, color: "white", fontSize: 14, borderRadius: 8, padding: "10px 20px" }}
            >
              เข้าสู่ระบบด้วย Google
            </button>
          )}
          {error.status === 403 && (
            <button
              onClick={() => router.push("/register")}
              className="hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ marginTop: 12, background: PRIMARY, color: "white", fontSize: 14, borderRadius: 8, padding: "10px 20px" }}
            >
              ไปกรอกโปรไฟล์
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  if (!result || !roadmap) {
    return (
      <AppShell activeNav="search" breadcrumb={breadcrumb}>
        <div style={{ padding: 48, fontFamily: FONT, color: "var(--ku-text-muted)" }}>
          ไม่พบผลลัพธ์
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell activeNav="search" breadcrumb={breadcrumb}>
      <LearnResultView query={query ?? ""} result={result} roadmap={roadmap} />
    </AppShell>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnPageInner />
    </Suspense>
  );
}
