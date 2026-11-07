import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked graph");

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("the keyword tab draws the graph's ideas as a word cloud, in Thai", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("Carbon Footprint");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();

  await page.getByRole("tab", { name: "คำสำคัญ" }).click();
  await expect(page).toHaveURL(/tab=cloud/);
  const cloud = page.getByRole("tabpanel").locator('svg[role="img"]');
  await expect(cloud).toBeVisible();
  await expect(cloud.locator("text").first()).toBeVisible();
  // no raw ids: the words go through the same Thai labels as the map
  const words = (await cloud.locator("text").allTextContents()).join(" ");
  for (const raw of ["isCourseFor", "carbon_stock", "Faculty_"]) expect(words).not.toContain(raw);

  // the layout settles: words must not keep moving after they are placed
  const positions = () => cloud.locator("text").evaluateAll((els) => els.map((e) => e.getAttribute("transform")).join("|"));
  const before = await positions();
  await page.waitForTimeout(1500);
  expect(await positions()).toBe(before);
});
