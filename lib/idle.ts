/** Contract C5: the backend session lasts 30 minutes idle. Warn at 25, sign out at 30. */
export const WARN_AFTER_MS = 25 * 60_000;
export const LOGOUT_AFTER_MS = 30 * 60_000;
/** Activity extends the server session only if a request goes out, so ping at most this often. */
export const KEEPALIVE_MS = 60_000;

export type IdleStep = "active" | "warn" | "logout";

export function idleStep(idleMs: number): IdleStep {
  if (idleMs >= LOGOUT_AFTER_MS) return "logout";
  if (idleMs >= WARN_AFTER_MS) return "warn";
  return "active";
}

/**
 * Tabs share one session cookie, so an idle tab must not sign out a tab that is in use:
 * activity is written here and every tab reads the latest value. Storage may be blocked; then each tab stands alone.
 */
const SHARED_KEY = "ku:last-active";
export function writeSharedActive(now: number) {
  try { localStorage.setItem(SHARED_KEY, String(now)); } catch { /* per-tab fallback */ }
}
export function readSharedActive(): number {
  try { return Number(localStorage.getItem(SHARED_KEY)) || 0; } catch { return 0; }
}
