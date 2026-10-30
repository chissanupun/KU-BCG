import { expect, test } from "@playwright/test";
import { mockApi } from "./mock";

test.skip(Boolean(process.env.E2E_BASE_URL), "redirect check runs against the local export");

// With no query and no stored result there is nothing to show, so both pages send the visitor home.
for (const url of ["/learn/", "/topic/", "/topic/?t=html-semantics"]) {
  test(`${url} without a result goes to the home page`, async ({ page }) => {
    await mockApi(page);
    await page.goto(url);
    await expect(page).toHaveURL(/\/$/);
  });
}
