# Contract C2 — pending search + polling

Screenshots from the static export with `/api/**` **mocked** (Chromium, 1440×900), using the shape the backend deploys
(`ku-phumpanya/docs/gates/frontend-handoff-tigger.md`, C2): the state is `data.result.status` (`"pending"` | `"ready"`)
on both `POST /api/search` and `GET /api/search/history/{id}`. `data.status` on POST is the DB column
(`success` / `error` / `zero_results`) and is not read. Async synthesis is still off on prod.

Checked:
- No `status` field: result shows at once, no extra GET (`legacy-no-status`).
- `pending` → evidence cards plus skeleton, polled every 1.5 s; after 3 GETs the full result replaces it (`poll-ready`).
- Never ready: message "ใช้เวลาประมวลผลนานเกินไป กรุณาลองค้นหาอีกครั้ง" after 30 s, 20 GETs (`never-ready`).
- No uncaught page errors in any run.
