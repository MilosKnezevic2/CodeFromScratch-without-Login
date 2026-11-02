import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

/**
 * Lets the admin check that server errors reach Sentry.
 *
 * Default: reports a test error, waits until it has been sent, and answers
 * with its event id. `?throw=1` throws instead, the way a real bug would, so
 * the path through instrumentation.ts (onRequestError) is tested too; that
 * page shows a 500 on purpose. Anyone but the admin gets a plain 403.
 */
export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const message = `Sentry test from the admin portal (${new Date().toISOString()})`;
  if (new URL(request.url).searchParams.get("throw") === "1") {
    throw new Error(`${message}, thrown`);
  }
  if (!Sentry.getClient()) {
    return NextResponse.json({ sent: false, reason: "Error tracking is not active in this deployment." }, { status: 503 });
  }
  const eventId = Sentry.captureException(new Error(message));
  const sent = await Sentry.flush(5000);
  return NextResponse.json({ sent, eventId }, { status: sent ? 200 : 502 });
}
