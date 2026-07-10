import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Database keepalive, hit by a daily Vercel cron (see vercel.json).
 *
 * The free-tier Postgres pauses after 7 days without activity. Public pages
 * only read Postgres opportunistically (home/blog stats degrade to zeros
 * when it is down), so a quiet week would otherwise put it to sleep and
 * silently break the paths that do need it: newsletter sign-ups, the
 * contact form, and those stats. One trivial query a day keeps it awake.
 *
 * When CRON_SECRET is set, Vercel sends it as a bearer token and we reject
 * everything else; without it the route is open but harmless (no data out,
 * rate of one row read).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "awake", time: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unreachable", time: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
