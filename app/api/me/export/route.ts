import { NextResponse } from "next/server";
import { currentReader } from "@/lib/comments-store";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Everything stored about the signed-in reader, as one JSON file (GDPR Art. 15 and 20). */
export async function GET() {
  const reader = await currentReader();
  if (!reader) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  if (!rateLimit(`export:${reader.id}`, 5, 60 * 60 * 1000).success) {
    return NextResponse.json({ error: "Try again in an hour." }, { status: 429 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: reader.id },
    select: {
      name: true,
      email: true,
      image: true,
      createdAt: true,
      weeklyGoal: true,
      trackReading: true,
      notifyReplies: true,
      weeklyReminder: true,
      accounts: { select: { provider: true } },
      comments: { orderBy: { createdAt: "asc" }, select: { postSlug: true, body: true, status: true, createdAt: true, deletedAt: true } },
      collections: { orderBy: { name: "asc" }, select: { id: true, name: true, color: true, createdAt: true } },
      savedPosts: { orderBy: { createdAt: "asc" }, select: { postSlug: true, createdAt: true, collections: { select: { collectionId: true } } } },
      readingHistory: {
        orderBy: { readAt: "asc" },
        select: { postSlug: true, readAt: true, completedAt: true, scrollPercent: true, lastPercent: true, secondsRead: true },
      },
      readingDays: { orderBy: { day: "asc" }, select: { day: true, seconds: true } },
    },
  });
  const newsletter = await prisma.newsletterSubscriber.findFirst({
    where: { OR: [{ userId: reader.id }, { email: user.email.toLowerCase() }] },
    select: { email: true, confirmed: true, confirmedAt: true, createdAt: true },
  });

  const folderNames = new Map(user.collections.map((c) => [c.id, c.name]));
  const data = {
    exportedAt: new Date().toISOString(),
    site: "codefromscratch.org",
    profile: {
      name: user.name,
      email: user.email,
      picture: user.image,
      memberSince: user.createdAt,
      signInWith: user.accounts.map((a) => a.provider),
    },
    settings: {
      weeklyGoal: user.weeklyGoal,
      trackReading: user.trackReading,
      replyEmails: user.notifyReplies,
      sundayReminder: user.weeklyReminder,
    },
    newsletter,
    comments: user.comments,
    folders: user.collections.map(({ name, color, createdAt }) => ({ name, color, createdAt })),
    saved: user.savedPosts.map((s) => ({ article: s.postSlug, savedAt: s.createdAt, folders: s.collections.map((c) => folderNames.get(c.collectionId)) })),
    readingHistory: user.readingHistory.map((h) => ({ article: h.postSlug, ...h, postSlug: undefined })),
    readingDays: user.readingDays.map((d) => ({ day: d.day.toISOString().slice(0, 10), seconds: d.seconds })),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="codefromscratch-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
