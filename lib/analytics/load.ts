import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import { dayKey } from "./events";
import { addDays, buildReport, type PostInfo, type Report, type SearchRow } from "./report";

const toDay = (date: Date) => date.toISOString().slice(0, 10);
const toDate = (day: string) => new Date(`${day}T00:00:00Z`);

export interface OutcomeFacts {
  confirmedSubscribers: number;
  waitingSubscribers: number;
  waitlistConfirmed: number;
  letters: { subject: string; status: string; sentCount: number; failedCount: number; sentAt: Date | null }[];
}

interface SanityPost {
  title: string;
  slug: string;
  publishedAt: string | null;
  category: string | null;
}

/** Loads the report for the last `days` days plus the same span before it, for comparison. */
export async function loadReport(days: number): Promise<Report> {
  const today = dayKey(new Date());
  // Google's newest day can lag by several days, so its look-back is a little wider.
  const from = toDate(addDays(today, -(days * 2 + 7)));

  const [counters, search, posts, firstCount] = await Promise.all([
    prisma.analyticsCounter.findMany({ where: { day: { gte: from } } }),
    prisma.searchStat.findMany({ where: { day: { gte: from } } }),
    client
      .fetch<SanityPost[]>(
        `*[_type == "post" && status == "published" && defined(slug.current)] | order(publishedAt desc) {
          title, "slug": slug.current, publishedAt, "category": categories[0]->title
        }`,
      )
      .catch((error: unknown): SanityPost[] => {
        // The numbers remain useful without titles; the table then says it is empty.
        console.error("Analytics could not load articles:", error);
        return [];
      }),
    prisma.analyticsCounter.findFirst({ orderBy: { day: "asc" }, select: { day: true } }),
  ]);

  return buildReport({
    days,
    today,
    posts: posts as PostInfo[],
    countingSince: firstCount ? toDay(firstCount.day) : null,
    counters: counters.map((c) => ({ day: toDay(c.day), metric: c.metric, key: c.key, value: c.value })),
    search: search.map(
      (s): SearchRow => ({
        day: toDay(s.day),
        kind: s.kind as SearchRow["kind"],
        key: s.key,
        clicks: s.clicks,
        impressions: s.impressions,
        position: s.position,
      }),
    ),
  });
}

export async function loadOutcomes(): Promise<OutcomeFacts> {
  const [confirmedSubscribers, waitingSubscribers, waitlistConfirmed, letters] = await Promise.all([
    prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    prisma.newsletterSubscriber.count({ where: { confirmed: false } }),
    prisma.courseWaitlist.count({ where: { confirmed: true } }),
    prisma.newsletterCampaign.findMany({
      where: { sentAt: { not: null } },
      orderBy: { sentAt: "desc" },
      take: 5,
      select: { subject: true, status: true, sentCount: true, failedCount: true, sentAt: true },
    }),
  ]);
  return { confirmedSubscribers, waitingSubscribers, waitlistConfirmed, letters };
}

/** The most read articles, in the shape the portal's lists already use. */
export async function topArticleViews(days: number, limit: number) {
  const views = await articleViews(days);
  return [...views.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([postSlug, count]) => ({ id: postSlug, postSlug, count }));
}

/** Real article views for the portal's other pages. `days` omitted means since counting began. */
export async function articleViews(days?: number): Promise<Map<string, number>> {
  const rows = await prisma.analyticsCounter.groupBy({
    by: ["key"],
    where: {
      metric: "view",
      key: { startsWith: "/blog/" },
      ...(days ? { day: { gte: toDate(addDays(dayKey(new Date()), -(days - 1))) } } : {}),
    },
    _sum: { value: true },
  });
  return new Map(
    rows
      .filter((row) => !row.key.endsWith("/*"))
      .map((row) => [row.key.replace("/blog/", ""), row._sum.value ?? 0]),
  );
}
