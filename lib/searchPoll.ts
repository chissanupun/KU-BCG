/** Contract C2: how often, and for how long, to re-read a search the backend marked "pending". */
export const POLL_MS = 1500;
export const POLL_TIMEOUT_MS = 30_000;

export type PollStep = "done" | "wait" | "timeout";

/**
 * What to do after reading a stored search. A missing `status` means a backend
 * that predates C2, so it counts as ready. Anything but "pending" ends the poll.
 */
export function pollStep(status: string | undefined, elapsedMs: number): PollStep {
  if (status !== "pending") return "done";
  return elapsedMs >= POLL_TIMEOUT_MS ? "timeout" : "wait";
}
