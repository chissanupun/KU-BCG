# Contract C2 — pending search + polling

Screenshots from the static export with `/api/**` **mocked** (Chromium, 1440×900). The real backend does
not send `status` yet, so this only shows the frontend behaviour.

Assumed shape (confirm with the backend owner): `POST /api/search` and `GET /api/search/history/{id}` carry
`data.status` (`"pending"` | `"ready"`), and while pending `data.result` may hold only `evidence`.

Checked:
- No `status` field: result shows at once, no extra GET (`legacy-no-status`).
- `pending` → evidence cards plus skeleton, polled every 1.5 s; after 3 GETs the full result replaces it (`poll-ready`).
- Never ready: message "ใช้เวลาประมวลผลนานเกินไป กรุณาลองค้นหาอีกครั้ง" after 30 s, 20 GETs (`never-ready`).
- No uncaught page errors in any run.
