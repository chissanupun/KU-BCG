import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test("progress page lists roadmaps from one /api/progress request", async ({ page }) => {
  await mockApi(page, { seed: ["Carbon Footprint", "Microplastics"] });
  const progressCalls: string[] = [];
  page.on("request", (r) => { if (/\/api\/.*progress/.test(r.url())) progressCalls.push(new URL(r.url()).pathname); });
  await page.goto("/progress/");

  await expect(page.locator("main li").getByText("Microplastics")).toBeVisible();
  await expect(page.getByText("เรียนจบแล้ว 0/3 หัวข้อ · 0%")).toHaveCount(2);
  // Newest first, and no per-row /history/{id}/progress requests.
  await expect(page.locator("main li").first()).toContainText("Microplastics");
  expect(progressCalls).toEqual(["/api/progress"]);
});
