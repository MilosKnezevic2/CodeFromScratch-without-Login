/**
 * The Sentry project's DSN (codefromscratch-web, EU region). A DSN is not a
 * secret: it only lets a client send events, and it ships in every browser
 * bundle anyway. It is kept here rather than in a hosting variable so error
 * tracking cannot silently disappear with a missing variable.
 *
 * An explicit NEXT_PUBLIC_SENTRY_DSN still wins, so a different project can
 * be used without a code change.
 */
export const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://326b7b7b766fc462ca26cfd24fce1e75@o4512364101697536.ingest.de.sentry.io/4512364302499920";

const PRODUCTION_HOST = "codefromscratch.org";

/**
 * Only the live site reports. Local builds and Vercel previews would fill the
 * free quota with errors nobody needs to read.
 */
export function shouldReport(env: { vercelEnv?: string; hostname?: string }): boolean {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) return true;
  if (env.hostname !== undefined) return env.hostname === PRODUCTION_HOST;
  return env.vercelEnv === "production";
}
