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
 * Forwards errors thrown while rendering or in route handlers to Sentry and
 * waits until the report has left. On Vercel the function can be frozen as
 * soon as the response is out; a deliberate server error from the admin
 * portal was initialised-and-captured but never arrived until this waited.
 * No-op when Sentry is not initialised.
 */
export const onRequestError: typeof Sentry.captureRequestError = async (...args) => {
  Sentry.captureRequestError(...args);
  await Sentry.flush(2000);
};
