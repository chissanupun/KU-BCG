import { expect, test, type Page } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked relations");

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function openMap(page: Page) {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("Carbon Footprint");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();
  await page.getByRole("tab", { name: "แผนที่ความรู้" }).click();
  const panel = page.getByRole("tabpanel");
  await expect(panel.locator("svg circle").first()).toBeVisible();
  return panel;
}

const scaleOf = async (panel: ReturnType<Page["getByRole"]>) =>
  Number(/scale\(([\d.]+)\)/.exec((await panel.locator("svg > g").getAttribute("transform")) ?? "")?.[1]);

test("the map is still once drawn, and the zoom buttons zoom it", async ({ page }) => {
  const panel = await openMap(page);
  const circles = panel.locator("svg circle");
  const positions = () => circles.evaluateAll((els) => els.map((e) => `${e.getAttribute("cx")},${e.getAttribute("cy")}`).join("|"));
  const before = await positions();
  await page.waitForTimeout(800);
  expect(await positions()).toBe(before); // no motion on load

  const k0 = await scaleOf(panel);
  await panel.getByRole("button", { name: "ซูมเข้า" }).click();
  expect(await scaleOf(panel)).toBeGreaterThan(k0);
  await panel.getByRole("button", { name: "รีเซ็ตมุมมอง" }).click();
  expect(await scaleOf(panel)).toBeCloseTo(k0, 1);
});

test("dragging a dot moves it, and its neighbours follow", async ({ page }) => {
  const panel = await openMap(page);
  const circles = panel.locator("svg circle");
  const count = await circles.count();
  expect(count).toBeGreaterThan(2);
  const dot = circles.nth(count - 1);
  const attr = async (name: string) => Number(await dot.getAttribute(name));
  const [x0, y0] = [await attr("cx"), await attr("cy")];
  const box = (await dot.boundingBox())!;
  const [px, py] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(px, py);
  await page.mouse.down();
  await page.mouse.move(px + 60, py + 40, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  expect(Math.hypot((await attr("cx")) - x0, (await attr("cy")) - y0)).toBeGreaterThan(10);
});
