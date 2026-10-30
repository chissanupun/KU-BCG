"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLoginUrl } from "@/lib/api";
import { useSearchResult } from "@/lib/useSearchResult";
import { useLearningProgress } from "@/lib/useLearningProgress";
import { DEFAULT_ROADMAP, fromGraphRag } from "@/lib/roadmap";
import { parseTab } from "@/lib/resultView";
import RoadmapView from "../components/roadmap/RoadmapView";
import PendingView from "./PendingView";
import ResultTabs from "./ResultTabs";
import OverviewTab from "./OverviewTab";
import MapTab from "./MapTab";

const PRIMARY = "#3b6347";

function LearnPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim();
  const rawHistoryId = searchParams.get("h")?.trim();
  const historyId = rawHistoryId && /^\d+$/.test(rawHistoryId) ? Number(rawHistoryId) : undefined;

  const { result, query, loading, pending, partialEvidence, error } = useSearchResult({
    historyId,
    query: historyId === undefined ? q : undefined,
    rewriteTo: "/learn",
  });

  const tab = parseTab(searchParams.get("tab"));

  const roadmap = useMemo(
    () => (result ? fromGraphRag(result, query, historyId) : null),
    [result, query, historyId],
  );

  // The URL rewrite from POST /api/search lands on `?h={id}`, so a fresh search
  // starts tracking as soon as its row exists.
  const { percent, completedCount, total, done, toggle, enabled } = useLearningProgress(historyId);
  const progress = enabled ? { percent, completedCount, total, done, toggle } : undefined;

  if (!q && historyId === undefined) return <RoadmapView roadmap={DEFAULT_ROADMAP} />;

  if (loading) {
    return <RoadmapView notice={<PendingView pending={pending} evidence={partialEvidence} />} />;
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

  return (
    <RoadmapView
      roadmap={roadmap}
      progress={progress}
      activeTab={tab}
      header={result && <ResultTabs title={result.title || query || roadmap?.title || ""} active={tab} />}
      body={result && tab === "overview" ? <OverviewTab result={result} /> : result && tab === "map" ? <MapTab key={historyId ?? query} graph={result.knowledge_graph} /> : undefined}
    />
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={null}>
      <LearnPageInner />
    </Suspense>
  );
}
