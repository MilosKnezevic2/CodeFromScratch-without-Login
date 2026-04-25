import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Edge-runtime Sentry — runs inside Next.js middleware and any
 * route handlers declared with `export const runtime = "edge"`.
 * Limited API surface compared to the Node server runtime.
 * Gated on DSN — no DSN, no initialisation.
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    tracesSampleRate: 0.1,
  });
}
