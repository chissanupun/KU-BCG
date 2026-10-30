import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

const live = Boolean(process.env.E2E_BASE_URL);
const BOX = "วันนี้อยากสำรวจเรื่องอะไร?";

test.beforeEach(async ({ page }) => {
  if (!live) await mockApi(page);
  await page.goto("/");
});

test("typing a Thai term lists suggestions with their kind", async ({ page }) => {
  await page.getByPlaceholder(BOX).fill("คาร์บอน");
  const options = page.getByRole("listbox").getByRole("option");
  await expect.poll(() => options.count()).toBeGreaterThanOrEqual(3);
  await expect(page.getByPlaceholder(BOX)).toHaveAttribute("aria-expanded", "true");
});

test("ArrowDown + Enter searches the highlighted suggestion; Esc closes the list", async ({ page }) => {
  const box = page.getByPlaceholder(BOX);
  await box.fill("คาร์บอน");
  const first = page.getByRole("option").first();
  await expect(first).toBeVisible();
  const text = (await first.locator("span").first().innerText()).trim();

  await box.press("ArrowDown");
  await expect(first).toHaveAttribute("aria-selected", "true");
  await box.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);

  await box.press("ArrowDown");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/learn\//);
  await expect(page.getByText(text).first()).toBeVisible();
});

test("clicking a suggestion searches it", async ({ page }) => {
  await page.getByPlaceholder(BOX).fill("microplastics");
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/learn\//);
});

test("no list for one character or for a term that matches nothing", async ({ page }) => {
  const box = page.getByPlaceholder(BOX);
  await box.fill("ค");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await box.fill("zzzzzz");
  await expect(page.getByRole("listbox")).toHaveCount(0);
});

test("Enter with no highlight searches the typed text, and empty text does nothing", async ({ page }) => {
  const box = page.getByPlaceholder(BOX);
  await box.press("Enter");
  await expect(page).toHaveURL(/localhost:\d+\/$/);
  await box.fill("วนเกษตร");
  await box.press("Enter");
  await expect(page).toHaveURL(/\/learn\//);
});

test("the list does not make the page scroll sideways on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByPlaceholder(BOX).fill("คาร์บอน");
  await expect(page.getByRole("option").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
