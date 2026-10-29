import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

// Gate 1.4.6. Mock-only: it checks layout, so it needs no login and spends no Gemini quota.
test.skip(Boolean(process.env.E2E_BASE_URL), "layout runs against the local export");

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1180, height: 820 },
  { width: 1024, height: 768 },
  { width: 810, height: 1080 },
];

const PAGES = [
  { name: "home", url: "/" },
  { name: "learn-overview", url: "/learn/?h=1&tab=overview" },
  { name: "learn-map", url: "/learn/?h=1&tab=map" },
  { name: "learn-path", url: "/learn/?h=1&tab=path" },
  { name: "topic", url: "/topic/?h=1&p=0&c=0" },
  { name: "smart-picks", url: "/smart-picks/" },
  { name: "progress", url: "/progress/" },
  { name: "register", url: "/register/", incomplete: true },
  { name: "admin", url: "/admin/" },
];

/** Elements that clip or scroll sideways: a sign something is wider than the box meant to hold it. */
const overflowing = () =>
  [document.documentElement, ...document.querySelectorAll("body *")]
    .filter((el) => {
      const ox = getComputedStyle(el).overflowX;
      return el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && (el === document.documentElement || ox !== "visible");
    })
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} ${el.scrollWidth}>${el.clientWidth}`);

for (const vp of VIEWPORTS) {
  for (const p of PAGES) {
    test(`${p.name} @ ${vp.width}x${vp.height}: no horizontal overflow`, async ({ page }, testInfo) => {
      await page.setViewportSize(vp);
      await mockApi(page, { seed: ["Carbon Footprint"], profileIncomplete: p.incomplete });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));

      await page.goto(p.url);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500); // fade-in + the graph's force simulation

      expect(await page.evaluate(overflowing), "elements wider than their box").toEqual([]);

      // The sidebar rail needs 1025px; at or below that it collapses behind a hamburger.
      const hamburger = page.getByRole("button", { name: "เมนู" });
      if (p.name !== "register") {
        if (vp.width <= 1024) await expect(hamburger).toBeVisible();
        else await expect(hamburger).toBeHidden();
      }
      expect(errors).toEqual([]);

      if (process.env.E2E_SHOTS) {
        const dir = path.join("docs/gates/1.4.6", testInfo.project.name);
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, `${p.name}-${vp.width}x${vp.height}.png`) });
      }
    });
  }
}

test("hamburger opens the drawer, a link closes it", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await mockApi(page, { seed: ["Carbon Footprint"] });
  await page.goto("/");
  await page.getByRole("button", { name: "เมนู" }).click();
  const drawer = page.getByRole("dialog", { name: "เมนู" });
  await expect(drawer.getByRole("link", { name: "ความก้าวหน้า" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("button", { name: "เมนู" })).toBeFocused(); // focus returns to the trigger
  // Same-route link: the shell stays mounted, so only the drawer's own click handler can close it.
  await page.getByRole("button", { name: "เมนู" }).click();
  await page.getByRole("dialog", { name: "เมนู" }).getByRole("link", { name: "ค้นหา", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "เมนู" }).click();
  await page.getByRole("button", { name: "ปิดเมนู" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: "เมนู" }).click();
  await page.getByRole("dialog", { name: "เมนู" }).getByRole("link", { name: "ความก้าวหน้า" }).click();
  await expect(page).toHaveURL(/\/progress\/$/);
});
