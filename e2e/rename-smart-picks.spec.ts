import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

// Smart Picks is shown to users as "แนะนำอัจฉริยะ"; the route and API path keep their names.
test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked API");

test("smart picks page and sidebar use Thai names", async ({ page }) => {
  await mockApi(page);
  await page.goto("/smart-picks/");

  await expect(page.getByRole("link", { name: "แนะนำอัจฉริยะ" })).toBeVisible();
  await expect(page.getByText("แนะนำอัจฉริยะ", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("คำแนะนำอันดับต้น")).toBeVisible();
  await expect(page.getByText("ล่าสุด", { exact: true })).toBeVisible();

  for (const english of ["Smart Picks", "TOP PICKS", "RECENTS"]) {
    await expect(page.getByText(english, { exact: true })).toHaveCount(0);
  }
});
