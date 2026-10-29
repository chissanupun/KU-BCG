# Gate 1.5.3 — PDPA UI (frontend half)

**Evidence type: MOCKED API.** Screenshots and `e2e/pdpa.spec.ts` run against the local static export with
`/api` stubbed. They prove the UI follows contracts C3, C4 and C5 of `frontend-handoff-tigger.md`. They do
not prove the deployed backend; that needs a live run with a signed-in session.

| Contract | UI | Spec |
|---|---|---|
| C4 consent | `ConsentModal` shows while `user.consent_required` is true (also again after a new notice version). Accept → `POST /api/consent` → user replaced. Decline → logout. Hidden on `/privacy`. | `consent (C4)` |
| C5 idle | `SessionGuard`: warning at 25 min idle, `POST /api/logout` and go `/` at 30 min. Any 401 from `/api/*` signs the tab out (a keep-alive `GET /api/user` runs at most once a minute while the user is active; its 401 also signs out). Idle time is shared between tabs through `localStorage["ku:last-active"]`, so an idle tab cannot end a session another tab is using. Both dialogs trap Tab. | `idle timeout (C5)` |
| C3 delete | `/profile`: button stays disabled until the typed email equals the account email (case-insensitive) → `DELETE /api/profile {confirm_email}` → 204 → logout → `/`. 422 shows `errors.confirm_email[0]`. | `profile and delete account (C3)` |

Pages added: `/profile` (name, email, faculty, role only), `/privacy` (list of collected data; the legal text
is a marked placeholder the team must supply).

## Screenshots (`chromium/`)

- `consent-modal.png`
- `idle-warning.png`
- `profile.png`
- `delete-account.png` (button enabled after the email matches), `delete-account-error.png` (422)

## Bundle check (`out/`, built with `NEXT_PUBLIC_API_URL=`)

- `localhost:8000`: absent.
- Secret patterns (Google API key, `sk-`, `GOCSPX`, `client_secret`, private-key header, AWS key id): none.
- `http://` strings: only XML namespaces (`w3.org`) and React internals (`fb.me/use-check-prop-types`). No `http://` fetch target.
- The only `fetch` calls are in `lib/api.ts` and use `${API_URL}`: empty (same origin) in the static build, `https://` in production.
- Browser storage: the spec asserts `localStorage`/`sessionStorage` hold no key matching google/token/auth/secret.

## Not covered here

- Live run against the deployed backend (consent version bump, real 30-minute expiry, real delete).
- WebKit/iPad (system libs missing on the dev machine).
- Final legal text for `/privacy`.
