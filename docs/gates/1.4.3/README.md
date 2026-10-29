# Gate 1.4.3 / 1.4.5 — sidebar and progress

Screenshots come from the static export with `/api/**` **mocked** (Chromium, 1440×900). They show layout
and behaviour only. Re-shoot against the deployed site once the Phase F3 E2E harness exists.

Checked in the mocked run:
- Sidebar entries: ค้นหา, Smart Picks, ความก้าวหน้า, RECENTS; each link navigates and the current page has `aria-current="page"`.
- `/progress` rows and the sidebar RECENTS list follow the order the API returned (`Zebra newest`, `Alpha older`, `Mid`): no client-side sort.
- `/progress` shows `เรียนจบแล้ว x/y หัวข้อ · p%` from `GET /api/search/history/{id}/progress`, one request per row.
- Home topic chips search immediately: one click on a chip fires one `POST /api/search` and lands on `/learn?h={id}`.
