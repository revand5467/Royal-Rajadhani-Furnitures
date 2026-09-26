/**
 * Small in-process fixed-window rate limiter.
 *
 * Good enough for a single-instance deployment and for blunting form spam and
 * password guessing. On a multi-instance host, swap this for a shared store
 * (Redis, Upstash) — the call signature is designed to make that easy.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    pruneIfStale(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Clears a bucket, e.g. after a successful sign-in. */
export function resetLimit(key: string): void {
  buckets.delete(key);
}

let lastPrune = 0;
function pruneIfStale(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
