import { NextResponse } from "next/server";

/**
 * Health check endpoint.
 *
 * Purpose:
 * - Uptime monitoring (UptimeRobot, BetterStack, etc.) hits this
 *   route and expects HTTP 200 + JSON.
 * - Deploy smoke-tests hit this immediately after a release to
 *   verify the app is responding.
 *
 * Contract (stable):
 * - HTTP 200 when the app process is responsive.
 * - JSON body with `status: "ok"`, `time`, and best-effort
 *   `commit` + `uptime` fields.
 *
 * What this route deliberately does NOT do:
 * - It does not probe the database, Sanity, Stripe, Resend, or any
 *   other upstream. An unreachable upstream should not take the
 *   whole site "down" in the monitor's view — those get their own
 *   deeper checks in the runbook. Keeping this endpoint minimal
 *   means the monitor only alerts on actual app-process failures.
 * - It does not read any secrets. Publicly-fetchable.
 * - It does not cache — every probe gets fresh state.
 *
 * No auth — intentional. Rate-limited if abused at infra layer
 * (hosting provider), not here.
 */
export const dynamic = "force-dynamic";

const startedAt = Date.now();

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "blog-cms",
      time: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GIT_COMMIT_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
