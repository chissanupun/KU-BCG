import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked relations");

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

// `/learn` map tab and `/topic` draw the same graph with the same component.
test("topic page shows the shared Thai graph, not raw relation names", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("Carbon Footprint");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();

  await page.getByRole("tab", { name: "แผนที่ความรู้" }).click();
  const learnSentences = await page.getByRole("tabpanel").getByRole("listitem").allInnerTexts();

  await page.getByRole("tab", { name: "เส้นทางการเรียนรู้" }).click();
  await page.getByRole("tabpanel").locator('a[href^="/topic"]').first().click();
  await expect(page).toHaveURL(/\/topic\/\?h=\d+&p=\d+&c=\d+/);

  const main = page.locator("main, body").first();
  await expect(main.locator('svg[role="img"]')).toBeVisible();
  expect((await main.locator("svg text").allTextContents()).join("")).toContain("ชีวมวล");
  await expect(main.getByRole("listitem").filter({ hasText: "เป็นชุดวิชาสำหรับ ชีวมวลและพลังงานทดแทนจากผลผลิตเกษตร" })).toBeVisible();
  for (const term of ["isCourseFor", "mitigatesCarbonVia", "Biomass & Bioenergy", "→ ", "carbon_stock"]) {
    await expect(main).not.toContainText(term);
  }
  const titles = (await main.locator("svg title").allTextContents()).join("\n");
  expect(titles).not.toContain("isCourseFor");
  expect(titles).not.toContain("Biomass & Bioenergy");

  // same relations as the map tab
  const topicSentences = await main.getByRole("listitem").allInnerTexts();
  for (const s of learnSentences) expect(topicSentences).toContain(s);
});

test("a curated topic still draws its spokes through the same component", async ({ page }) => {
  await page.goto("/topic/?t=html-semantics");
  await expect(page.locator('svg[role="img"]')).toBeVisible();
  await expect(page.locator("svg text").first()).toBeVisible();
});
