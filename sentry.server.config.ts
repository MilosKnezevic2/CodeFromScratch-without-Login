import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Server-side Sentry — runs in the Node.js runtime. Captures
 * unhandled errors in route handlers, server components, server
 * actions, and API routes. Gated on DSN env var — no DSN, no
 * initialisation.
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    tracesSampleRate: 0.1,
  });
}
