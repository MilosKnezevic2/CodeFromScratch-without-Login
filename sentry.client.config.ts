import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Client-side Sentry — runs in the browser. Captures uncaught JS
 * errors, unhandled promise rejections, and routing / navigation
 * events. Gated on `NEXT_PUBLIC_SENTRY_DSN` — no DSN, no initialisation,
 * no network traffic, no cost.
 *
 * Set NEXT_PUBLIC_SENTRY_DSN in Vercel Production environment once the
 * Sentry project is created (see docs/deploy-playbook-2026-04.md §8).
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV ??
      "unknown",
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Ignore common noise
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      /^AbortError/,
      /^Network request failed/,
    ],
  });
}
