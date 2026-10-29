import type { Page } from "@playwright/test";
import type { GraphRagResult } from "../lib/types";

const user = {
  id: 1, name: "E2E User", email: "e2e@example.com", email_verified_at: "2026-01-01", role: "student", google_id: null,
  avatar_url: null, profile_completed_at: "2026-01-01", faculty: "เกษตร", department: null, student_id: null,
  employee_id: null, research_affiliation: null, created_at: "", updated_at: "",
};

// Deliberately not imported from topics.ts: the spec must be able to fail when a faculty is missing.
// Same per-topic mapping the backend returns; any other query gets all four.
const FACULTIES = ["เกษตร", "อุตสาหกรรมเกษตร", "วนศาสตร์", "ประมง"];
const FACULTIES_BY_TOPIC: Record<string, string[]> = {
  "ชีวมวลและพลังงานทดแทน": ["เกษตร", "อุตสาหกรรมเกษตร", "วนศาสตร์"],
  "ไคโตซานและบรรจุภัณฑ์ชีวภาพ": ["ประมง", "อุตสาหกรรมเกษตร", "เกษตร"],
  "Microplastics": ["ประมง", "อุตสาหกรรมเกษตร", "เกษตร"],
  "Carbon Footprint": ["วนศาสตร์", "เกษตร", "อุตสาหกรรมเกษตร", "ประมง"],
  "การเพาะเลี้ยงสัตว์น้ำที่ยั่งยืน": ["ประมง", "อุตสาหกรรมเกษตร"],
  "วนเกษตร": ["วนศาสตร์", "เกษตร", "ประมง"],
};

const node = (label: string, type: "topic" | "faculty" | "course" | "bcg_pillar") => ({ label, color: "#2D5A43", type });

function resultFor(query: string): GraphRagResult {
  const faculties = FACULTIES_BY_TOPIC[query] ?? FACULTIES;
  return {
    // C1 as deployed: pillars are Bio / Circular / Green with no BCG_ prefix.
    tags: { bcg_pillars: ["Green", "Bio"], faculties },
    title: query,
    overview: { intro: `${query}: ภาพรวมโดยย่อ`, analogy: "เปรียบเทียบให้เข้าใจง่าย", research_basis: "อ้างอิงงานวิจัย KU", expert: "ผู้เชี่ยวชาญตัวอย่าง" },
    knowledge_graph: {
      center: node(query, "topic"),
      description: `แผนที่ความรู้ของ ${query}`,
      nodes: [node("BCG_Green", "bcg_pillar"), ...faculties.map((f) => node(f, "faculty")), node("kumooc-1", "course")],
      edges: [{ from: query, to: "BCG_Green", type: "relatedTo" }, ...faculties.map((f) => ({ from: query, to: f, type: "studiedBy" }))],
    },
    learning_path: {
      estimated_hours: "20 ชั่วโมง",
      subtitle: "เส้นทางตัวอย่าง",
      phases: [
        { name: "รากฐาน", intro: "เริ่มต้น", modules: [{ title: "โมดูลแรก", hours: "5 ชั่วโมง", desc: "รายละเอียด" }, { title: "โมดูลสอง", hours: "5 ชั่วโมง", desc: "รายละเอียด" }] },
        { name: "ต่อยอด", intro: "ลึกขึ้น", modules: [{ title: "โมดูลสาม", hours: "10 ชั่วโมง", desc: "รายละเอียด" }] },
      ],
    },
    evidence: [
      { title: `KU Forest: ${query}`, source: "KU_Forest", url: "https://example.com/forest", snippet: "สรุปย่อ" },
      { title: `KUKR: ${query}`, source: "KUKR", url: "https://example.com/kukr", snippet: "สรุปย่อ" },
      { title: `KU MOOC: ${query}`, source: "KU_MOOC", url: "https://example.com/mooc" },
    ],
  };
}

/** Stands in for the Laravel API when the suite runs against the local static export. */
export async function mockApi(page: Page) {
  const stored: string[] = []; // history id = index + 1
  await page.route("**/sanctum/**", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const json = (body: unknown) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (path === "/api/user") return json(user);
    if (path === "/api/search/recent") return json({ data: stored.map((query, i) => ({ id: i + 1, query, created_at: "2026-10-29" })).reverse() });
    if (path === "/api/search" && request.method() === "POST") {
      const { query } = request.postDataJSON() as { query: string };
      stored.push(query);
      return json({ data: { id: stored.length, user_id: 1, query, result: resultFor(query), created_at: "", updated_at: "" } });
    }
    const progress = path.match(/^\/api\/search\/history\/(\d+)\/progress$/);
    if (progress) return json({ data: { completed: [], completed_count: 0, total: 3, percent: 0 } });
    const history = path.match(/^\/api\/search\/history\/(\d+)$/);
    if (history) {
      const query = stored[Number(history[1]) - 1];
      if (!query) return route.fulfill({ status: 404, body: "{}" });
      return json({ data: { id: Number(history[1]), query, tab: "overview", result: resultFor(query), created_at: "" } });
    }
    return route.fulfill({ status: 404, body: "{}" });
  });
}
