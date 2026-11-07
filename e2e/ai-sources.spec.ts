import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked evidence");

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("AI-written overview and learning path say so and link the portals they are based on", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("Carbon Footprint");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();

  const note = page.getByRole("tabpanel").getByTestId("ai-generated-note");
  await expect(note).toContainText("สร้างโดย AI");
  await expect(note).toContainText("ภาพรวมนี้เรียบเรียงโดย AI");
  // the mock evidence sits on example.com, under three source names: one link each, to the site root
  for (const name of ["KU Forest ↗", "KUKR ↗", "KU MOOC ↗"]) {
    await expect(note.getByRole("link", { name })).toHaveAttribute("href", "https://example.com");
  }
  await expect(note.getByRole("link", { name: "KUKR ↗" })).toHaveAttribute("target", "_blank");

  await page.getByRole("tab", { name: "เส้นทางการเรียนรู้" }).click();
  await expect(page.getByTestId("ai-generated-note")).toContainText("เส้นทางการเรียนรู้นี้เรียบเรียงโดย AI");
});
