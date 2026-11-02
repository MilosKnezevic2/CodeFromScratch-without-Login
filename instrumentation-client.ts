import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Client-side Sentry: uncaught errors and unhandled promise rejections in
 * the browser. Next 16 builds with Turbopack load this file
 * (instrumentation-client.ts); the old sentry.client.config.ts was never
 * read under Turbopack, so browser errors would not have arrived even with
 * a DSN. No DSN, no initialisation, no network traffic.
 *
 * No session replay: it records the page, including what readers type into
 * the sign-up and contact forms, which is more than an error report needs.
 */
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      /^AbortError/,
      /^Network request failed/,
    ],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
