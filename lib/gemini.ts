const MODEL = "gemini-flash-lite-latest";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type SummaryDoc = {
  title?: string;
  abstract?: string;
  source?: string;
};

export async function summarizeSearchResults(query: string, docs: SummaryDoc[]): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || docs.length === 0) return null;

  const context = docs
    .slice(0, 8)
    .map((d, i) => `${i + 1}. [${d.source ?? "?"}] ${d.title ?? ""} — ${d.abstract ?? ""}`)
    .join("\n");

  const prompt = `คำค้นหาของผู้ใช้: "${query}"\n\nนี่คือรายการงานวิจัย/คอร์สที่เกี่ยวข้อง:\n${context}\n\nสรุปภาพรวมสั้นๆ (2-4 ประโยค) เป็นภาษาไทยว่าผลลัพธ์เหล่านี้ครอบคลุมเรื่องอะไรบ้าง โดยไม่ต้องทวนคำถาม`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      console.error("Gemini summary failed:", res.status, await res.text());
      return null;
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text.trim() : null;
  } catch (err) {
    console.error("Gemini summary error:", err);
    return null;
  }
}
