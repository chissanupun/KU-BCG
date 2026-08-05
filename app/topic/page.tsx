"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { googleLoginUrl } from "@/lib/api";
import { useSearchResult } from "@/lib/useSearchResult";
import { DEFAULT_TOPICS, DEFAULT_TOPIC_SLUG, topicFromGraphRag } from "@/lib/topic";
import TopicView from "../components/topic/TopicView";

const PRIMARY = "#3b6347";

function toIndex(raw: string | null): number {
  const value = raw?.trim();
  return value && /^\d+$/.test(value) ? Number(value) : 0;
}

function TopicPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawHistoryId = searchParams.get("h")?.trim();
  const historyId = rawHistoryId && /^\d+$/.test(rawHistoryId) ? Number(rawHistoryId) : undefined;
  const phaseIndex = toIndex(searchParams.get("p"));
  const cardIndex = toIndex(searchParams.get("c"));
  const slug = searchParams.get("t")?.trim() || DEFAULT_TOPIC_SLUG;

  // Read-only page: it replays a stored result and never runs a search, so no
  // `query` and no URL rewrite.
  const { result, loading, error } = useSearchResult({ historyId });

  const detail = useMemo(
    () => (result ? topicFromGraphRag(result, phaseIndex, cardIndex) : null),
    [result, phaseIndex, cardIndex],
  );

  if (historyId === undefined) {
    return <TopicView detail={DEFAULT_TOPICS[slug] ?? DEFAULT_TOPICS[DEFAULT_TOPIC_SLUG]} />;
  }

  if (loading) {
    return <TopicView notice={<span style={{ color: "var(--ku-text-muted)" }}>กำลังโหลด...</span>} />;
  }

  if (error) {
    return (
      <TopicView
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

  if (!detail) {
    return <TopicView notice={<span style={{ color: "var(--ku-text-muted)" }}>ไม่พบหัวข้อนี้ในเส้นทางการเรียนรู้</span>} />;
  }

  return <TopicView detail={detail} />;
}

export default function TopicPage() {
  return (
    <Suspense fallback={null}>
      <TopicPageInner />
    </Suspense>
  );
}
