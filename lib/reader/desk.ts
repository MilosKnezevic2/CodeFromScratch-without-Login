import { prisma } from "@/lib/prisma";
import { getDeskPosts, type DeskPostCard } from "@/lib/sanity/queries";
import {
  activityGrid,
  folderHex,
  milestones,
  READ_AT_PERCENT,
  readingStats,
  topicProgress,
  utcDay,
  weekProgress,
} from "./rules";

export interface DeskFolder {
  id: string;
  name: string;
  color: string;
  hex: string;
  count: number;
}

/** The reader's folders with their article counts, for the side menu and the library. */
export async function deskFolders(userId: string): Promise<DeskFolder[]> {
  const rows = await prisma.collection.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, _count: { select: { savedPosts: true } } },
  });
  return rows.map((f) => ({ id: f.id, name: f.name, color: f.color, hex: folderHex(f.color), count: f._count.savedPosts }));
}

export type HistoryEntry = {
  postSlug: string;
  scrollPercent: number;
  lastPercent: number;
  secondsRead: number;
  completedAt: Date | null;
  readAt: Date;
};

/** A dead Sanity must not take the dashboard with it: the desk then shows the reader's own rows only. */
async function posts(): Promise<DeskPostCard[]> {
  return getDeskPosts().catch((error: unknown) => {
    console.error("Dashboard could not load the article list:", error);
    return [];
  });
}

/** Everything the dashboard home and the progress page compute from. */
export async function loadDesk(userId: string, now = new Date()) {
  const since = new Date(utcDay(now).getTime() - 7 * 12 * 24 * 60 * 60 * 1000);
  const [user, history, saved, days, allPosts] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { weeklyGoal: true, trackReading: true, dashboardSeenAt: true, createdAt: true },
    }),
    prisma.readingHistory.findMany({
      where: { userId },
      orderBy: { readAt: "desc" },
      select: { postSlug: true, scrollPercent: true, lastPercent: true, secondsRead: true, completedAt: true, readAt: true },
    }),
    prisma.savedPost.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { postSlug: true, createdAt: true } }),
    prisma.readingDay.findMany({ where: { userId, day: { gte: since } }, select: { day: true, seconds: true } }),
    posts(),
  ]);

  const bySlug = new Map(allPosts.map((p) => [p.slug, p]));
  const published = new Set(allPosts.map((p) => p.slug));
  const isRead = (h: HistoryEntry) => Boolean(h.completedAt) || h.scrollPercent >= READ_AT_PERCENT;
  const readSlugs = new Set(history.filter((h) => published.has(h.postSlug) && isRead(h)).map((h) => h.postSlug));
  const topics = topicProgress(allPosts, readSlugs);
  const stats = readingStats(history, published);

  return {
    user,
    history,
    saved,
    posts: allPosts,
    bySlug,
    stats,
    week: weekProgress(
      history.flatMap((h) => (h.completedAt ? [h.completedAt] : [])),
      user.weeklyGoal,
      now,
    ),
    activity: activityGrid(days, now),
    activeDays: days.filter((d) => d.seconds > 0).length,
    topics,
    milestones: milestones(readSlugs.size, topics),
    inProgress: history.filter((h) => published.has(h.postSlug) && !isRead(h)),
  };
}
