import * as Sentry from "@sentry/nextjs";
import { SENTRY_DSN, shouldReport } from "@/lib/sentry-dsn";

/**
 * Edge-runtime Sentry — runs inside Next.js middleware and any
 * route handlers declared with `export const runtime = "edge"`.
 * Limited API surface compared to the Node server runtime.
 * Gated on DSN — no DSN, no initialisation.
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
