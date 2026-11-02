import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, shouldReport } from "@/lib/sentry-dsn";

/**
 * Server-side Sentry — runs in the Node.js runtime. Captures
 * unhandled errors in route handlers, server components, server
 * actions, and API routes. Gated on DSN env var — no DSN, no
 * initialisation.
 */
if (shouldReport({ vercelEnv: process.env.VERCEL_ENV })) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || SENTRY_DSN,
    environment:
      process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
