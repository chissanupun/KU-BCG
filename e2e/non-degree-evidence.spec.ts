import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

// The Non-Degree match comes from course titles only, so its card says so (mock mode only: live results depend on the index).
test.skip(Boolean(process.env.E2E_BASE_URL), "needs the mocked evidence");

test("a Non-Degree evidence card is labelled and says the match is from the title", async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill("non-degree");
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();

  const card = page.getByRole("article").filter({ hasText: "ธุรกิจการป่าไม้" });
  await expect(card.getByText("Non-Degree", { exact: true })).toBeVisible();
  await expect(card.getByText("จับคู่กับหัวข้อจากชื่อชุดวิชา (ยังไม่ได้ตรวจเนื้อหา)")).toBeVisible();
  await expect(card.getByRole("link", { name: /ดูแหล่งข้อมูลต้นทาง/ })).toHaveAttribute("href", "https://sis.ku.ac.th/forest-based-enterprises/");
  // Other sources do not get the note.
  await expect(page.getByText("จับคู่กับหัวข้อจากชื่อชุดวิชา")).toHaveCount(1);
});
