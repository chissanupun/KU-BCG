import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "concept chips run against the local export and its mock");

test.describe("module concepts (plan E)", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { seed: ["Carbon Footprint"] });
    await page.goto("/learn/?h=1&tab=path");
    await expect(page.getByText("โมดูลสาม")).toBeVisible();
  });

  test("a card lists what it teaches, what to know first and its level in Thai", async ({ page }) => {
    const third = page.locator('[data-testid="module-concepts"]').filter({ hasText: "ควรรู้ก่อน" });
    await expect(third.getByTestId("module-teaches")).toContainText("กระบวนการสู่ความเป็นกลางทางคาร์บอน");
    await expect(third.getByTestId("module-needs")).toContainText("พื้นฐานการคำนวณคาร์บอนฟุตพริ้นท์");
    await expect(third.getByTestId("module-level")).toContainText("ระดับ: กลาง");
  });

  test("an AI-drafted level is labelled as a suggestion, a curated one is not", async ({ page }) => {
    await expect(page.getByTestId("module-level").filter({ hasText: "พื้นฐาน" })).toContainText("แนะนำ (AI ประเมิน)");
    await expect(page.getByTestId("module-level").filter({ hasText: "กลาง" })).not.toContainText("AI");
  });

  test("an unknown concept id never reaches the screen and a card without data shows no chips", async ({ page }) => {
    await expect(page.getByText("not_a_known_concept")).toHaveCount(0);
    await expect(page.getByTestId("module-teaches")).toHaveCount(2);
  });
});
