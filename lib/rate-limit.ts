/**
 * Fixed-window rate limiter, in-memory.
 *
 * Scope: per server instance. On serverless (Vercel) each instance keeps its
 * own map, so this is a soft limit — it stops naive loops, not a distributed
 * attacker. That is a deliberate launch-phase decision; honeypots on the
 * public forms carry the spam defense. A durable limiter (Redis/KV) is an
 * infrastructure decision recorded for the SaaS relaunch.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/** Expired entries are swept opportunistically once the map grows past this
 *  bound — a `setInterval` would keep serverless instances alive for nothing. */
const SWEEP_THRESHOLD = 5000;

function sweepExpired(now: number): void {
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();

  if (rateLimitMap.size >= SWEEP_THRESHOLD) {
    sweepExpired(now);
  }

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

/** Test hook: clears all counters so cases start from a clean window. */
export function resetRateLimitStore(): void {
  rateLimitMap.clear();
}
