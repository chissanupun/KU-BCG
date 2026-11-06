import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

// Mock mode only: live results depend on whether the translations are imported.
test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked translations");

const BADGE = "แปลโดย AI · ต้นฉบับเป็นภาษาอังกฤษ";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("ai-translation");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();
});

test("an AI-translated evidence card shows Thai first, the English original, and the badge", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "สารเคลือบไคโตซานที่กินได้สำหรับกล้วย" });
  await expect(card.getByText("Chitosan edible coating for bananas")).toBeVisible();
  await expect(card.getByText("ยืดอายุการเก็บรักษา")).toBeVisible();
  const badge = card.getByTestId("ai-badge");
  await expect(badge).toHaveText(BADGE);
  await expect(badge).toHaveAttribute("title", "แปลโดย claude-sonnet-5-5 เมื่อ 2026-10-30");
});

test("a Thai original is never replaced or badged", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "งานวิจัยที่เป็นไทยอยู่แล้ว" });
  await expect(card).toBeVisible();
  await expect(card.getByTestId("ai-badge")).toHaveCount(0);
  await expect(page.getByText("ไม่ควรถูกใช้")).toHaveCount(0);
});

test("the learning-path card and the topic page carry the translation, badge and original", async ({ page }) => {
  await page.getByRole("tab", { name: "เส้นทางการเรียนรู้" }).click();
  const card = page.getByRole("tabpanel").locator('a[href^="/topic"]').first();
  await expect(card.getByText("สารเคลือบไคโตซานที่กินได้สำหรับกล้วย")).toBeVisible();
  await expect(card.getByTestId("ai-badge")).toHaveText(BADGE);
  await card.click();

  await expect(page).toHaveURL(/\/topic\/\?h=\d+&p=0&c=0/);
  await expect(page.getByText("สารเคลือบไคโตซานที่กินได้สำหรับกล้วย").first()).toBeVisible();
  await expect(page.getByTestId("ai-badge")).toHaveText(BADGE);
  await expect(page.getByText("สารเคลือบไคโตซานช่วยยืดอายุการเก็บรักษาได้ 40%")).toBeVisible();
  await expect(page.getByText("ไคโตซาน", { exact: true })).toBeVisible(); // keyword tag, Thai
  await expect(page.getByText("Banana", { exact: true })).toHaveCount(0);
  // The Thai abstract is already whole, so there is no second "full abstract" toggle beside the English fold.
  await expect(page.getByRole("button", { name: "ดูบทคัดย่อเต็ม" })).toHaveCount(0);

  // The English abstract stays one click away.
  const original = page.getByText("Chitosan coating extended shelf life by 40%.");
  await expect(original).toBeHidden();
  await page.getByText("ดูต้นฉบับภาษาอังกฤษ").click();
  await expect(original).toBeVisible();
});

test("a result without translations shows no badge anywhere", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("Carbon Footprint");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();
  await expect(page.getByRole("article").first()).toBeVisible();
  await expect(page.getByTestId("ai-badge")).toHaveCount(0);
});
