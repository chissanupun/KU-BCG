"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLoginUrl } from "@/lib/api";
import { useSearchResult } from "@/lib/useSearchResult";
import { DEFAULT_ROADMAP, fromGraphRag } from "@/lib/roadmap";
import RoadmapView from "../components/roadmap/RoadmapView";

const PRIMARY = "#3b6347";

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

  if (!q && historyId === undefined) return <RoadmapView roadmap={DEFAULT_ROADMAP} />;

  if (loading) {
    return <RoadmapView notice={<span style={{ color: "var(--ku-text-muted)" }}>กำลังค้นหา...</span>} />;
  }

  if (error) {
    return (
      <RoadmapView
        notice={
          <div>
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
        }
      />
    );
  }

  return <RoadmapView roadmap={roadmap} />;
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnPageInner />
    </Suspense>
  );
}
