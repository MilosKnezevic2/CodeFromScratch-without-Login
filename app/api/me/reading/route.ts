import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishedSlugs } from "@/lib/analytics/store";
import { currentReader } from "@/lib/comments-store";
import { rateLimit } from "@/lib/rate-limit";
import { isSlug, parseProgress, READ_AT_PERCENT } from "@/lib/reader/rules";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Where the reader left off in one article, for "continue where you left off". */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!isSlug(slug)) return json({ error: "Not found" }, 404);
  const reader = await currentReader();
  if (!reader) return json({ signedIn: false });
  const row = await prisma.readingHistory.findUnique({
    where: { userId_postSlug: { userId: reader.id, postSlug: slug } },
    select: { lastPercent: true, scrollPercent: true },
  });
  return json({ signedIn: true, lastPercent: row?.lastPercent ?? 0, furthest: row?.scrollPercent ?? 0 });
}

/**
 * One progress report from an article page: where the reader is now and how
 * many seconds they spent since the last report. Furthest point only grows,
 * time adds up, "read" is stamped once. Nothing is stored for a reader who
 * switched tracking off.
 */
export async function POST(request: Request) {
  const reader = await currentReader();
  if (!reader) return json({ error: "Sign in first." }, 401);
  const progress = parseProgress(await request.json().catch(() => null));
  if (!progress) return json({ error: "Invalid report" }, 400);
  if (!rateLimit(`reading:${reader.id}`, 60, 60 * 1000).success) return json({ ok: true });

  const settings = await prisma.user.findUnique({ where: { id: reader.id }, select: { trackReading: true } });
  if (!settings?.trackReading) return json({ ok: true, tracked: false });

  const slugs = await publishedSlugs();
  if (slugs && !slugs.has(progress.slug)) return json({ error: "Not found" }, 404);

  const key = { userId_postSlug: { userId: reader.id, postSlug: progress.slug } };
  const finished = progress.percent >= READ_AT_PERCENT;
  await prisma.readingHistory.upsert({
    where: key,
    create: {
      userId: reader.id,
      postSlug: progress.slug,
      scrollPercent: progress.percent,
      lastPercent: progress.percent,
      secondsRead: progress.seconds,
      ...(finished && { completedAt: new Date() }),
    },
    update: { readAt: new Date(), lastPercent: progress.percent, secondsRead: { increment: progress.seconds } },
  });
  // The furthest point and the "read" stamp only move forward.
  await prisma.readingHistory.updateMany({
    where: { userId: reader.id, postSlug: progress.slug, scrollPercent: { lt: progress.percent } },
    data: { scrollPercent: progress.percent },
  });
  if (finished) {
    await prisma.readingHistory.updateMany({
      where: { userId: reader.id, postSlug: progress.slug, completedAt: null },
      data: { completedAt: new Date() },
    });
  }
  return json({ ok: true, tracked: true });
}
