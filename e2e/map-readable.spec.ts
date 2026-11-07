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

const dot = (panel: ReturnType<Page["locator"]>, name: string | RegExp) =>
  panel.locator("svg g[data-node]").filter({ has: panel.page().locator("title", { hasText: name }) }).locator("circle");

test("clicking a dot explains its relations as Thai sentences, with no developer terms on the page", async ({ page }) => {
  const panel = await openMap(page, "Carbon Footprint");
  await dot(panel, /^ป่าไม้/).click();
  const card = panel.getByRole("region", { name: "คำอธิบายความสัมพันธ์" });
  await expect(card.getByText("ป่าไม้ ช่วยลดคาร์บอนผ่าน คาร์บอนที่สะสมไว้")).toBeVisible();
  await card.getByRole("button", { name: "ปิดคำอธิบาย" }).click();
  await expect(card).toHaveCount(0);

  await dot(panel, /^การคำนวณคาร์บอนฟุตพริ้นท์รายบุคคล/).click();
  await expect(card.getByText(/การคำนวณคาร์บอนฟุตพริ้นท์รายบุคคล.* เป็นคอร์สเริ่มต้นสำหรับ ผู้เรียนเรื่องคาร์บอนฟุตพริ้นท์/)).toBeVisible();
  for (const term of DEV_TERMS) await expect(panel).not.toContainText(term);
  // titles are tooltips, so they are not in innerText: check them too
  const titles = await panel.locator("svg title").allTextContents();
  for (const term of DEV_TERMS) expect(titles.join("\n")).not.toContain(term);
});

test("clicking a line explains that one relation and where it came from; clicking the background clears it", async ({ page }) => {
  const panel = await openMap(page, "Carbon Footprint");
  await panel.locator("svg line[data-hit]").first().click(); // a real pointer click, so the hit line is proven to receive events
  const card = panel.getByRole("region", { name: "คำอธิบายความสัมพันธ์" });
  await expect(card).toContainText("ที่มา:");
  await panel.locator("svg").click({ position: { x: 6, y: 6 } });
  await expect(card).toHaveCount(0);
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
