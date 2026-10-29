import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";
import { FACULTIES, TOPICS } from "./topics";

const live = Boolean(process.env.E2E_BASE_URL);

test.beforeEach(async ({ page }) => {
  if (!live) await mockApi(page);
});

// One search per topic; the four faculties are checked inside it (a search per faculty would
// quadruple the Gemini calls a live run spends without testing anything else).
for (const topic of TOPICS) {
  test(`search → overview → map → path → topic: ${topic}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && !/favicon/.test(m.text()) && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/");
    await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill(topic);
    await page.getByRole("button", { name: "เริ่มค้นหา" }).click();
    await expect(page).toHaveURL(/\/learn\/\?h=\d+/, { timeout: live ? 90_000 : 10_000 });

    await test.step("overview: tags and evidence", async () => {
      await expect(page.getByRole("tab", { name: "ภาพรวม" })).toHaveAttribute("aria-selected", "true", { timeout: 60_000 });
      await expect(page.getByRole("heading", { name: "หลักฐานจากแหล่งข้อมูล KU", exact: false })).toBeVisible();
      await expect(page.getByRole("tabpanel").locator("article").first()).toBeVisible();
      await expect(page.getByRole("tabpanel").getByText(/^BCG_/).first()).toBeVisible();
      for (const faculty of FACULTIES) {
        await test.step(`faculty chip: ${faculty}`, async () => {
          await expect(page.getByLabel("หมวด BCG และคณะที่เกี่ยวข้อง").getByText(faculty, { exact: true })).toBeVisible();
        });
      }
    });

    await test.step("map", async () => {
      await page.getByRole("tab", { name: "แผนที่ความรู้" }).click();
      await expect(page).toHaveURL(/tab=map/);
      await expect(page.getByRole("tabpanel").locator("svg circle").first()).toBeVisible();
    });

    let cardTitle = "";
    await test.step("path", async () => {
      await page.getByRole("tab", { name: "เส้นทางการเรียนรู้" }).click();
      await expect(page).toHaveURL(/tab=path/);
      const card = page.getByRole("tabpanel").locator('a[href^="/topic"]').first();
      await expect(card).toBeVisible();
      cardTitle = (await card.innerText()).split("\n")[0].trim();
      expect(cardTitle).not.toBe(""); // getByText("") would match the whole page
      await card.click();
    });

    await test.step("topic page", async () => {
      await expect(page).toHaveURL(/\/topic\/\?h=\d+&p=\d+&c=\d+/);
      await expect(page.getByText(cardTitle).first()).toBeVisible();
    });

    expect(errors).toEqual([]);
  });
}
