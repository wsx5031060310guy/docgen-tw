// In-memory sliding-window rate limiter, keyed by an arbitrary identifier
// (API key id, IP, etc.). Sized for low traffic — replace with Redis if
// horizontal scaling matters.
//
// Limits:
//   - FREE plan API: 60 req/min  (10 req/min burst over 6s window guarded too)
//   - PRO plan API:  600 req/min
//
// Returns { ok, remaining, resetAt } and stashes recent hits in a global Map.

const WINDOW_MS = 60_000;

interface Bucket {
  timestamps: number[];
}

declare global {
  // eslint-disable-next-line no-var
  var __docgenRateBuckets: Map<string, Bucket> | undefined;
}
const buckets: Map<string, Bucket> =
  globalThis.__docgenRateBuckets ?? (globalThis.__docgenRateBuckets = new Map());

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  resetMs: number; // ms until oldest hit drops out
}

export function checkRateLimit(key: string, limit: number, windowMs = WINDOW_MS): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const b = buckets.get(key) ?? { timestamps: [] };
  // Drop expired timestamps
  while (b.timestamps.length > 0 && b.timestamps[0] <= cutoff) b.timestamps.shift();

  if (b.timestamps.length >= limit) {
    const resetMs = b.timestamps[0] + windowMs - now;
    return { ok: false, limit, remaining: 0, resetMs };
  }
  b.timestamps.push(now);
  buckets.set(key, b);
  return { ok: true, limit, remaining: limit - b.timestamps.length, resetMs: windowMs };
}

/** Periodic cleanup — call from cron to avoid map growing unboundedly. */
export function pruneRateBuckets() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [k, b] of buckets.entries()) {
    while (b.timestamps.length > 0 && b.timestamps[0] <= cutoff) b.timestamps.shift();
    if (b.timestamps.length === 0) buckets.delete(k);
  }
}
