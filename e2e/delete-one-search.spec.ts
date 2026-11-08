import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "deletes history; runs against the mocked API only");

test("one recent search is deleted after confirming, the others stay", async ({ page }) => {
  const { calls } = await mockApi(page, { seed: ["Carbon Footprint", "Microplastics"] });
  await page.goto("/");
  const recent = page.locator("aside");
  await expect(recent.getByRole("link", { name: "Microplastics" })).toBeVisible();

  await recent.getByRole("button", { name: "ลบ Microplastics" }).click();
  await expect(recent.getByText("ลบรายการนี้?")).toBeVisible();
  await recent.getByRole("button", { name: "ยกเลิก" }).click();
  await expect(recent.getByRole("link", { name: "Microplastics" })).toBeVisible();
  expect(calls.filter((c) => c.method === "DELETE")).toHaveLength(0);

  await recent.getByRole("button", { name: "ลบ Microplastics" }).click();
  await recent.getByRole("button", { name: "ยืนยันลบ Microplastics" }).click();
  await expect(recent.getByRole("link", { name: "Microplastics" })).toHaveCount(0);
  await expect(recent.getByRole("link", { name: "Carbon Footprint" })).toBeVisible();
  expect(calls.filter((c) => c.method === "DELETE").map((c) => c.path)).toEqual(["/api/search/history/2"]);

  await page.reload();
  await expect(recent.getByRole("link", { name: "Carbon Footprint" })).toBeVisible();
  await expect(recent.getByRole("link", { name: "Microplastics" })).toHaveCount(0);
});

test("a failed delete keeps the row", async ({ page }) => {
  await mockApi(page, { seed: ["Carbon Footprint"], deleteFails: true });
  await page.goto("/");
  const recent = page.locator("aside");
  await recent.getByRole("button", { name: "ลบ Carbon Footprint" }).click();
  await recent.getByRole("button", { name: "ยืนยันลบ Carbon Footprint" }).click();
  await expect(recent.getByRole("link", { name: "Carbon Footprint" })).toBeVisible();
});
