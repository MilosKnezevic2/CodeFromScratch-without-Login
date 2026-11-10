import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyReminders } from "@/lib/reader/notify";
import { getSettings } from "@/lib/settings/store";

export const dynamic = "force-dynamic";
// Up to REMINDER_BATCH sends one after another.
export const maxDuration = 60;

/**
 * The Sunday reminder, run by a Vercel cron (vercel.json). It sends email, so
 * unlike the keepalive it refuses to run without CRON_SECRET: a public URL
 * must not be able to mail every reader who opted in.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await getSettings()).features.registrationOpen) {
    return NextResponse.json({ skipped: "reader accounts are switched off" });
  }
  const result = await sendWeeklyReminders();
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
