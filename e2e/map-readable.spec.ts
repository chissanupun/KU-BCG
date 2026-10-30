import { expect, test, type Page } from "@playwright/test";
import { mockApi } from "./mock";

const live = Boolean(process.env.E2E_BASE_URL);
test.skip(live, "needs the mocked relations");

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

async function openMap(page: Page, query: string) {
  await page.goto("/");
  await page.getByPlaceholder("วันนี้อยากสำรวจเรื่องอะไร?").fill(query);
  await page.getByRole("button", { name: "เริ่มค้นหา" }).click();
  await page.getByRole("tab", { name: "แผนที่ความรู้" }).click();
  return page.getByRole("tabpanel");
}

const DEV_TERMS = ["relatedTo", "studiedBy", "mitigatesCarbonVia", "isEntryPointFor", "carbon_stock", "--["];

test("relations are written as Thai sentences, with no developer terms on the page", async ({ page }) => {
  const panel = await openMap(page, "Carbon Footprint");
  await expect(panel.getByRole("heading", { name: "ความสัมพันธ์ในแผนที่นี้" })).toBeVisible();
  const list = panel.getByRole("list");
  await expect(list.getByText("ป่าไม้ ช่วยลดคาร์บอนผ่าน คาร์บอนที่สะสมไว้")).toBeVisible();
  await expect(list.getByText(/การคำนวณคาร์บอนฟุตพริ้นท์รายบุคคล.* เป็นคอร์สเริ่มต้นสำหรับ ผู้เรียนเรื่องคาร์บอนฟุตพริ้นท์/)).toBeVisible();
  for (const term of DEV_TERMS) await expect(panel).not.toContainText(term);
  // titles are tooltips, so they are not in innerText: check them too
  const titles = await panel.locator("svg title").allTextContents();
  for (const term of DEV_TERMS) expect(titles.join("\n")).not.toContain(term);
});

test("legend names the node types in Thai", async ({ page }) => {
  const panel = await openMap(page, "Carbon Footprint");
  await expect(panel.getByText("หัวข้อ", { exact: true })).toBeVisible();
  await expect(panel.getByText("คณะ", { exact: true })).toBeVisible();
  await expect(panel.getByText(/วงกลม = สิ่งที่เกี่ยวข้อง/)).toBeVisible();
});

test("an English backend description is replaced by a Thai summary", async ({ page }) => {
  const panel = await openMap(page, "english-description");
  await expect(panel).not.toContainText("GraphRAG");
  await expect(panel.getByText(/เชื่อมโยงกับ \d+ เรื่อง ผ่าน \d+ ความสัมพันธ์/)).toBeVisible();
});

test("a Thai backend description is kept", async ({ page }) => {
  const panel = await openMap(page, "Carbon Footprint");
  await expect(panel.getByText("แผนที่ความรู้ของ Carbon Footprint")).toBeVisible();
});

test("a long relation list is folded and can be expanded", async ({ page }) => {
  const panel = await openMap(page, "many-edges");
  const items = panel.getByRole("list").getByRole("listitem");
  await expect(items).toHaveCount(8);
  await panel.getByRole("button", { name: /ดูทั้งหมด \(\d+\)/ }).click();
  expect(await items.count()).toBeGreaterThan(12);
});
