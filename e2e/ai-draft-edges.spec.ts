import { expect, test, type Page } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked relations");

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function openMap(page: Page, query: string) {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill(query);
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();
  await page.getByRole("tab", { name: "แผนที่ความรู้" }).click();
  return page.getByRole("tabpanel");
}

test("an AI-drafted edge is dashed, labelled, and explained in the legend; the Thai wording comes from the new tables", async ({ page }) => {
  const panel = await openMap(page, "ai-draft");
  const draft = panel.getByRole("listitem").filter({ hasText: "ใบอ้อยและชานอ้อย เป็นพื้นฐานของ ชีวมวล" });
  await expect(draft).toBeVisible();
  await expect(draft.getByTestId("ai-draft")).toHaveText(/ร่างจาก AI/);
  await expect(panel.getByTestId("ai-draft-legend")).toContainText("เส้นประ");
  await expect(panel.locator('line[data-origin="ai_suggested"]')).toHaveAttribute("stroke-dasharray", "5 4");
  await expect(panel.locator('line[data-origin="curated"]').first()).not.toHaveAttribute("stroke-dasharray", /.+/);
  await expect(panel).not.toContainText("providesBackgroundFor");
  await expect(panel).not.toContainText("sugarcane_residue");
});

test("verified relations carry no AI label when there are no drafts", async ({ page }) => {
  const panel = await openMap(page, "Carbon Footprint");
  await expect(panel.getByTestId("ai-draft")).toHaveCount(0);
  await expect(panel.getByTestId("ai-draft-legend")).toHaveCount(0);
});
