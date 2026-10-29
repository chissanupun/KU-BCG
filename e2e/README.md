# E2E

`npm run e2e` runs the suite on Chromium, Firefox, WebKit and iPad (gen 7). First time: `npx playwright install chromium firefox webkit`.

## Local mode (default)

`npm run build`, then `npm run e2e`. Serves `out/` on port 3100 and mocks `/api` and `/sanctum`; no login and no backend needed.
This proves the UI flow only. It is not evidence for the acceptance gates.

## Live mode (gate evidence)

1. Sign in by hand on the deployed site in a normal browser, then export the session to `e2e/.auth/state.json`
   (Playwright `storageState` format: cookies + origins). That path is git-ignored; never commit it.
2. `E2E_BASE_URL=https://phumpanya.ku.ac.th npm run e2e` (Chromium only; set `E2E_ALL_PROJECTS=1` for the other three)

Each topic runs the full GraphRAG pipeline and spends Gemini quota. A free-tier key allows about 20 requests a day,
so one project already uses 6 of them. Use a paid key before running all four projects (24 searches).

Live runs turn traces and screenshots off, because a trace records the session cookie.
The HTML report is written to `docs/gates/1.5.1/report`. Mock runs write to `playwright-report/` instead. Commit the gate report (`git add -f`, the folder is ignored) only from a live run.

## Layout (gate 1.4.6)

`e2e/layout.spec.ts` loads every page at 1440×900, 1280×800, 1180×820, 1024×768 and 810×1080 and fails if any
element is wider than its box, or if the hamburger is missing at ≤1024px / present above it. Mock mode only.
`E2E_SHOTS=1 npx playwright test e2e/layout.spec.ts` also writes a screenshot per case to `docs/gates/1.4.6/<project>/`.
