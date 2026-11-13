import { NextRequest, NextResponse } from "next/server";
import { cycleTaskFor } from "@/lib/brand-cycle";

export const dynamic = "force-dynamic";

/**
 * Starts the brand's writing cycle, run by a Vercel cron (vercel.json) on
 * cycle days in the early afternoon, so the drafts are ready before the
 * operator's 18:00 review. The cycle itself is a GitHub Actions workflow in a
 * private repository; GitHub's own schedule proved unreliable (it never
 * started a scheduled run there in November 2026), so this asks GitHub's API
 * to start it instead. With auto=true the workflow does nothing when the
 * day's work is already done, so a second trigger costs nothing.
 *
 * Needs CRON_SECRET (Vercel sends it), GH_CYCLE_REPO ("owner/name") and
 * GH_CYCLE_TOKEN (a fine-grained token limited to that repository, with
 * Actions read and write). Nothing is read or written here besides the
 * dispatch request.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const repo = process.env.GH_CYCLE_REPO;
  const token = process.env.GH_CYCLE_TOKEN;
  if (!repo || !token) {
    return NextResponse.json({ error: "GH_CYCLE_REPO or GH_CYCLE_TOKEN is not set" }, { status: 500 });
  }
  const task = cycleTaskFor(new Date());
  if (!task) return NextResponse.json({ skipped: "not a cycle day" });

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/brand-cycle.yml/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ref: "main", inputs: { task, auto: "true" } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status !== 204) {
      console.error(`brand-cycle dispatch: GitHub answered ${res.status}`, await res.text().catch(() => ""));
      return NextResponse.json({ error: `GitHub answered ${res.status}` }, { status: 502 });
    }
    return NextResponse.json({ dispatched: task }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("brand-cycle dispatch failed", error);
    return NextResponse.json({ error: "GitHub could not be reached" }, { status: 502 });
  }
}
