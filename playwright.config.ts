import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Two modes, picked by E2E_BASE_URL:
 *  - unset: serves the local static export (`npm run build` first) and mocks /api, so the
 *    suite runs anywhere with no login and no backend.
 *  - set: runs against that deployed site with a real login. Export a signed-in session to
 *    E2E_STORAGE_STATE (default e2e/.auth/state.json, git-ignored) first. See e2e/README.md.
 */
const baseURL = process.env.E2E_BASE_URL;
const live = Boolean(baseURL);
const storageState = process.env.E2E_STORAGE_STATE ?? "e2e/.auth/state.json";

if (live && !fs.existsSync(storageState)) {
  throw new Error(`E2E_BASE_URL is set but ${storageState} does not exist. See e2e/README.md.`);
}

export default defineConfig({
  testDir: "e2e",
  // A live search runs the whole GraphRAG pipeline (seconds, and it spends Gemini quota).
  timeout: live ? 120_000 : 30_000,
  workers: live ? 1 : undefined,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "docs/gates/1.5.1/report", open: "never" }]],
  use: {
    baseURL: baseURL ?? "http://localhost:3100",
    storageState: live ? storageState : undefined,
    trace: "retain-on-failure",
  },
  webServer: live
    ? undefined
    : { command: "python3 -m http.server 3100 --directory out", url: "http://localhost:3100/", reuseExistingServer: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "ipad", use: { ...devices["iPad (gen 7)"] } },
  ],
});
