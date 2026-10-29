# Gate 1.4.6 — responsive layout

Screenshots come from the static export with `/api/**` **mocked**: layout evidence only, not a deployed-site check.
Regenerate with `npm run build && E2E_SHOTS=1 npx playwright test e2e/layout.spec.ts`.

- Browsers run: Chromium and Firefox, 5 viewports × 9 pages each (`chromium/`, `firefox/`).
  Viewports: 1440×900, 1280×800, 1180×820, 1024×768, 810×1080.
- **Not run: WebKit and iPad (gen 7).** Playwright's WebKit needs system libraries this machine lacks
  (`sudo npx playwright install-deps`). Run the same command on a machine that has them, or on a real iPad and Safari.
- Pages: `/`, `/learn` (overview, map, path tabs), `/topic`, `/smart-picks`, `/progress`, `/register`, `/admin`.

What `e2e/layout.spec.ts` asserts for every page and viewport:
- No element is wider than its own box (document and any clipping or scrolling container), so nothing overflows sideways.
- The hamburger ("เมนู") is visible at ≤1024px and hidden above it. `/register` has no sidebar and is excluded from this check.
- No uncaught page errors.
- Separate test: at 1024×768 the hamburger opens the drawer, Esc closes it, and tapping a link navigates and closes it.

Behaviour changes to know about:
- Sidebar is a fixed rail from 1025px up (so 1180×820 landscape keeps it, 1024×768 gets the hamburger header).
- Content columns are fluid: max 569px (606px on `/topic`), inset `clamp(24px, 16vw, 231px)` from the left.
- The topic pill (`/learn` default roadmap, `/topic` badge) sits in the column flow instead of an absolute position.
- `/register` is a flowing form (two columns, one on narrow screens); the green laptop panel shows from 1025px up.
- Topic mind map follows its container width (max 606px).
