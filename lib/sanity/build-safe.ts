/**
 * Wraps a Sanity read for statically generated public pages.
 *
 * During `next build` a failed read degrades to the fallback so a Sanity
 * outage can never fail the whole deploy — the page ships empty and heals
 * on its first successful ISR revalidation (60s).
 *
 * At request time the error is rethrown on purpose: ISR keeps serving the
 * last good version on a failed background revalidation (stale-on-error),
 * which beats caching an empty page over real content for a one-minute
 * blip. Cold renders with no cached version land on app/error.tsx.
 */
export async function buildSafe<T>(read: Promise<T>, fallback: T): Promise<T> {
  try {
    return await read;
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.error("[build-safe] Sanity unreachable during build — shipping fallback:", error);
      return fallback;
    }
    throw error;
  }
}
