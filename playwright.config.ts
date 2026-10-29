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
  timeout: live ? 240_000 : 30_000,
  workers: live ? 1 : undefined,
  retries: 0,
  // Only a live run may write to the gate folder, so a mock run cannot overwrite evidence.
  reporter: [["list"], ["html", { outputFolder: live ? "docs/gates/1.5.1/report" : "playwright-report", open: "never" }]],
  use: {
    baseURL: baseURL ?? "http://localhost:3100",
    storageState: live ? storageState : undefined,
    // A trace records request headers, i.e. the session cookie; a live report may be committed.
    trace: live ? "off" : "retain-on-failure",
    screenshot: "off",
  },
  webServer: live
    ? undefined
    : { command: "python3 -m http.server 3100 --directory out", url: "http://localhost:3100/", reuseExistingServer: true },
  // Each project is 6 live searches. A live run covers Chromium only unless E2E_ALL_PROJECTS=1.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(live && !process.env.E2E_ALL_PROJECTS
      ? []
      : [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
          { name: "ipad", use: { ...devices["iPad (gen 7)"] } },
        ]),
  ],
});
