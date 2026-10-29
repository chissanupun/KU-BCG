# Gate 1.4.1 / 1.4.2 — result page tabs

Screenshots here come from the static export (`out/`) with `/api/**` **mocked** (Chromium, 1440×900),
not from the live backend. They show layout and behaviour only; they are not evidence that the real
API returns BCG pillar / faculty nodes or three evidence sources for the six topics. Re-shoot against
the deployed site once Phase F3 lands (`E2E_BASE_URL`).

- `t1`–`t6`: the six gate 1.1.1 topics (ชีวมวลและพลังงานทดแทน … วนเกษตร, in acceptance-PDF order) × overview / map / path (`t1-map-filtered`, `t1-map-expanded`: filter and expand buttons)
- `old`: result with no `evidence`, no `overview`, empty graph (older stored row) — renders empty states, no crash
- `badurl`: first evidence item has a `javascript:` URL — card renders, no link
- Console errors across all runs: 0. Horizontal scroll at 1440×900: none.
