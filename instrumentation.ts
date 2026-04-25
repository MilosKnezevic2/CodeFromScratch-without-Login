import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation entry point. Runs once per server process
 * startup — both on the Node runtime and the Edge runtime. Loads the
 * appropriate Sentry config for the runtime currently starting.
 *
 * See https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Forward nested request errors to Sentry so they aren't swallowed by
 * Next's default error handling. No-op when Sentry's DSN is unset.
 */
export const onRequestError = Sentry.captureRequestError;
