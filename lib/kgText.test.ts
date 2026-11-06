import test from "node:test";
import assert from "node:assert/strict";
import { PREDICATE_TH, edgeSentence, graphSummary, humanLabel, isAiDraft, pickDescription } from "./kgText";

test("edgeSentence reads as a Thai sentence", () => {
  assert.equal(edgeSentence("forest", "mitigatesCarbonVia", "carbon_stock"), "ป่าไม้ ช่วยลดคาร์บอนผ่าน คาร์บอนที่สะสมไว้");
});

test("edgeSentence: unknown or missing predicate falls back to 'เกี่ยวข้องกับ'", () => {
  assert.equal(edgeSentence("A", "unknownType", "B"), "A เกี่ยวข้องกับ B");
  assert.equal(edgeSentence("A", "", "B"), "A เกี่ยวข้องกับ B");
});

test("every predicate in the table has a non-empty phrase", () => {
  for (const [type, phrase] of Object.entries(PREDICATE_TH)) assert.ok(phrase.trim(), type);
  for (const type of ["relatedTo", "studiedBy", "isCourseFor", "mitigatesCarbonVia", "requires"]) assert.ok(PREDICATE_TH[type], type);
});

test("humanLabel: faculty, BCG pillar, course code", () => {
  assert.equal(humanLabel("Faculty_ประมง"), "คณะประมง");
  assert.equal(humanLabel("BCG_Green"), "เศรษฐกิจสีเขียว");
  assert.equal(humanLabel("BCG_Bio"), "เศรษฐกิจชีวภาพ");
  assert.equal(humanLabel("bcg_circular"), "เศรษฐกิจหมุนเวียน");
  assert.equal(humanLabel("kumooc025"), "Microplastics 101");
  assert.equal(humanLabel("kumooc999"), "คอร์ส kumooc999");
});

test("humanLabel: unknown slugs and odd input never throw or come back empty", () => {
  assert.equal(humanLabel("some_new_slug"), "some new slug");
  assert.equal(humanLabel("AGRIS_Q"), "AGRIS Q");
  assert.equal(humanLabel("ปลานิล"), "ปลานิล");
  assert.ok(humanLabel("Faculty_"));
  assert.equal(humanLabel(""), "");
  assert.equal(humanLabel(undefined as unknown as string), "");
});

test("pickDescription: English backend text is replaced, Thai backend text is kept", () => {
  const summary = "สรุปภาษาไทย";
  assert.equal(pickDescription("GraphRAG subgraph from KU BCG relations (KUKR + KU Forest + KU MOOC).", summary), summary);
  assert.equal(pickDescription(undefined, summary), summary);
  assert.equal(pickDescription("", summary), summary);
  assert.equal(pickDescription("แผนที่ความรู้ของ Carbon Footprint", summary), "แผนที่ความรู้ของ Carbon Footprint");
});

test("graphSummary counts only the other nodes", () => {
  assert.equal(graphSummary("Carbon Footprint", 5, 4), "Carbon Footprint เชื่อมโยงกับ 5 เรื่อง ผ่าน 4 ความสัมพันธ์");
  assert.equal(graphSummary("Carbon Footprint", 3, 0), "Carbon Footprint เชื่อมโยงกับ 3 เรื่อง");
  assert.equal(graphSummary("kumooc005", 0, 0), "การคำนวณคาร์บอนฟุตพริ้นท์รายบุคคล จาก Application CF Calculation ยังไม่มีเรื่องที่เชื่อมโยง");
});

test("every predicate and new concept in the AI-drafted relations has Thai wording", async () => {
  const { default: relations } = await import("../elastic-search/data/ai-relations.json");
  const { default: concepts } = await import("../elastic-search/data/ai-concepts.json");
  const missing = [...new Set(relations.map((r) => r.predicate))].filter((p) => !PREDICATE_TH[p]);
  assert.deepEqual(missing, []);
  for (const c of concepts) assert.match(humanLabel(c.id), /[ก-๙]/, c.id);
});

test("only ai_suggested edges count as AI drafts", () => {
  assert.equal(isAiDraft({ origin: "ai_suggested" }), true);
  assert.deepEqual([{}, { origin: "derived" }].map(isAiDraft), [false, false]);
});
