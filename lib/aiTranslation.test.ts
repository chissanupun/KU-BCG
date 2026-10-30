import test from "node:test";
import assert from "node:assert/strict";
import { badgeTooltip, shownKeywords, shownText } from "./aiTranslation";

test("an English original is replaced by its translation and kept as `original`", () => {
  assert.deepEqual(shownText("Biomass energy", "พลังงานชีวมวล"), { text: "พลังงานชีวมวล", original: "Biomass energy" });
});

test("text that already has Thai is never shown as a translation", () => {
  assert.deepEqual(shownText("ชีวมวล Biomass", "พลังงานชีวมวล"), { text: "ชีวมวล Biomass" });
});

test("no translation, or a blank one, leaves the original alone", () => {
  assert.deepEqual(shownText("Biomass"), { text: "Biomass" });
  assert.deepEqual(shownText("Biomass", "  "), { text: "Biomass" });
});

test("keywords translate one by one and only when the arrays line up", () => {
  assert.deepEqual(shownKeywords(["Biomass", "ไคโตซาน"], ["ชีวมวล", "ไคโตซาน"]), { tags: ["ชีวมวล", "ไคโตซาน"], translated: true });
  assert.deepEqual(shownKeywords(["ไคโตซาน"], ["x"]), { tags: ["ไคโตซาน"], translated: false });
  assert.deepEqual(shownKeywords(["Biomass", "Carbon"], ["ชีวมวล"]), { tags: ["Biomass", "Carbon"], translated: false });
});

test("the tooltip names the model and the date, and is absent without a model", () => {
  assert.equal(badgeTooltip({ model: "claude-sonnet-5-5", translated_at: "2026-10-30T09:00:00Z" }), "แปลโดย claude-sonnet-5-5 เมื่อ 2026-10-30");
  assert.equal(badgeTooltip(undefined), undefined);
});
