import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

// A Non-Degree card is labelled as a short course and links to its sis page (mock mode only: live results depend on the index).
test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked evidence");

test("a Non-Degree evidence card is labelled as a short course and links to sis", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("non-degree");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();

  const card = page.getByRole("article").filter({ hasText: "ธุรกิจการป่าไม้" });
  await expect(card.getByText("Non-Degree", { exact: true })).toBeVisible();
  await expect(card.getByText("ชุดวิชาระยะสั้น", { exact: true })).toBeVisible();
  await expect(card.getByRole("link", { name: /ดูชุดวิชาที่ sis\.ku\.ac\.th/ })).toHaveAttribute("href", "https://sis.ku.ac.th/forest-based-enterprises/");
  // Internal review wording never reaches users, and other sources keep the generic link and have no short-course tag.
  await expect(page.getByText("ยังไม่ได้ตรวจเนื้อหา")).toHaveCount(0);
  await expect(page.getByText("ชุดวิชาระยะสั้น", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("link", { name: /ดูแหล่งข้อมูลต้นทาง/ }).first()).toBeVisible();
});
