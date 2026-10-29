import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mockApi } from "./mock";

// Gate 1.5.3. Mock-only: the backend contracts C3/C4/C5 are mocked, so this proves the UI half only.
test.skip(Boolean(process.env.E2E_BASE_URL), "pdpa runs against the local export");

const MIN = 60_000;
const HOME = "http://localhost:3100/";

async function shot(page: Page, testInfo: TestInfo, name: string) {
  if (!process.env.E2E_SHOTS) return;
  const dir = path.join("docs/gates/1.5.3", testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
}

test.describe("consent (C4)", () => {
  test("blocks the app until accepted, then asks the API once", async ({ page }, testInfo) => {
    const { calls } = await mockApi(page, { consentRequired: true });
    await page.goto("/");
    const modal = page.getByRole("dialog", { name: /ประกาศความเป็นส่วนตัว/ });
    await expect(modal).toBeVisible();
    await shot(page, testInfo, "consent-modal");

    await modal.getByRole("button", { name: "ยอมรับ", exact: true }).click();
    await expect(modal).toBeHidden();
    expect(calls.filter((c) => c.path === "/api/consent")).toHaveLength(1);
  });

  test("decline signs out", async ({ page }) => {
    const { calls } = await mockApi(page, { consentRequired: true });
    await page.goto("/smart-picks/");
    await page.getByRole("button", { name: "ไม่ยอมรับและออกจากระบบ" }).click();
    await expect(page).toHaveURL(HOME);
    expect(calls.some((c) => c.path === "/api/logout")).toBe(true);
  });

  test("Tab cannot leave the modal", async ({ page }) => {
    await mockApi(page, { consentRequired: true });
    await page.goto("/");
    const modal = page.getByRole("dialog", { name: /ประกาศความเป็นส่วนตัว/ });
    await expect(modal).toBeVisible();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press(i % 2 ? "Shift+Tab" : "Tab");
      expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);
    }
  });

  test("the notice page itself stays readable", async ({ page }) => {
    await mockApi(page, { consentRequired: true });
    await page.goto("/privacy/");
    await expect(page.getByRole("heading", { name: "ประกาศความเป็นส่วนตัว" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});

test.describe("idle timeout (C5)", () => {
  test("warns at 25 min, 'ใช้งานต่อ' dismisses it", async ({ page }, testInfo) => {
    await page.clock.install();
    await mockApi(page);
    await page.goto("/progress/");
    await expect(page.getByText("E2E User")).toBeVisible();

    await page.clock.fastForward(25 * MIN);
    const warning = page.getByRole("alertdialog");
    await expect(warning).toBeVisible();
    await shot(page, testInfo, "idle-warning");

    await warning.getByRole("button", { name: "ใช้งานต่อ" }).click();
    await expect(warning).toBeHidden();
    // The clock restarted: 25 more minutes are needed before the next warning.
    await page.clock.fastForward(10 * MIN);
    await expect(warning).toBeHidden();
  });

  test("activity in another tab cancels the warning", async ({ page }) => {
    await page.clock.install();
    await mockApi(page);
    await page.goto("/progress/");
    await expect(page.getByText("E2E User")).toBeVisible();
    await page.clock.fastForward(25 * MIN);
    await expect(page.getByRole("alertdialog")).toBeVisible();

    // What another tab writes on every click or keypress.
    await page.evaluate(() => localStorage.setItem("ku:last-active", String(Date.now())));
    await page.clock.fastForward(2_000);
    await expect(page.getByRole("alertdialog")).toBeHidden();
  });

  test("a keep-alive 401 signs the tab out", async ({ page }) => {
    await page.clock.install();
    const { calls } = await mockApi(page);
    await page.goto("/progress/");
    await expect(page.getByText("E2E User")).toBeVisible();

    await page.route("**/api/user", (r) => r.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
    await page.clock.fastForward(61_000); // past KEEPALIVE_MS
    await page.mouse.click(600, 400);
    await expect(page).toHaveURL(HOME);
    expect(calls.some((c) => c.path === "/api/logout")).toBe(true);
  });

  test("signs out and goes home at 30 min", async ({ page }) => {
    await page.clock.install();
    const { calls } = await mockApi(page);
    await page.goto("/progress/");
    await expect(page.getByText("E2E User")).toBeVisible();

    await page.clock.fastForward(25 * MIN);
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.clock.fastForward(5 * MIN);
    await expect(page).toHaveURL(HOME);
    expect(calls.some((c) => c.method === "POST" && c.path === "/api/logout")).toBe(true);
  });
});

test.describe("profile and delete account (C3)", () => {
  test("shows only name, email, faculty and role", async ({ page }, testInfo) => {
    await mockApi(page);
    await page.goto("/profile/");
    const fields = page.locator("dl");
    await expect(fields).toContainText("E2E User");
    await expect(fields).toContainText("e2e@example.com");
    await expect(fields).toContainText("เกษตร");
    await expect(fields).toContainText("นิสิต");
    await expect(page.locator("dt")).toHaveCount(4);
    await shot(page, testInfo, "profile");
  });

  test("delete needs the typed email, then calls DELETE and leaves", async ({ page }, testInfo) => {
    const { calls } = await mockApi(page);
    await page.goto("/profile/");
    const button = page.getByRole("button", { name: "ลบบัญชีถาวร" });
    const input = page.getByLabel(/พิมพ์อีเมลของคุณ/);

    await expect(button).toBeDisabled();
    await input.fill("someone-else@example.com");
    await expect(button).toBeDisabled();
    await input.fill("E2E@Example.com"); // case does not matter
    await expect(button).toBeEnabled();
    await shot(page, testInfo, "delete-account");

    await button.click();
    await expect(page).toHaveURL(HOME);
    const del = calls.filter((c) => c.method === "DELETE" && c.path === "/api/profile");
    expect(del).toHaveLength(1);
    expect(del[0].body).toEqual({ confirm_email: "E2E@Example.com" });
  });

  test("shows the server's 422 message and stays on the page", async ({ page }, testInfo) => {
    await mockApi(page, { deleteFails: true });
    await page.goto("/profile/");
    await page.getByLabel(/พิมพ์อีเมลของคุณ/).fill("e2e@example.com");
    await page.getByRole("button", { name: "ลบบัญชีถาวร" }).click();
    await expect(page.getByText("อีเมลไม่ตรงกับบัญชีของคุณ")).toBeVisible(); // Next also owns a role=alert route announcer
    await expect(page).toHaveURL(/\/profile\/$/);
    await shot(page, testInfo, "delete-account-error");
  });
});

test("browser storage holds no token or Google id", async ({ page }) => {
  await mockApi(page);
  await page.goto("/profile/");
  await expect(page.getByText("E2E User").first()).toBeVisible();
  const keys = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
  expect(keys.filter((k) => /google|token|auth|secret/i.test(k))).toEqual([]);
});
