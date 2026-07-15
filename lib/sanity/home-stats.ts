import "server-only";
import { client } from "./client";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export type HomeStats = {
  totalPosts: number;
  totalReadsAllTime: number;
  readsLast30d: number;
  subscribers: number;
  firstPostAt: string | null;
  lastPublishedAt: string | null;
  yearsActive: number;
};

/**
 * Aggregate home-page stats. Includes lifetime totals (posts,
 * subscribers, reads), 30-day reader volume, and the year the blog
 * launched. Tolerant of missing infra so the home page renders
 * even when Sanity or Postgres are unreachable.
 */
export async function getHomeStats(): Promise<HomeStats> {
  let totalPosts = 0;
  let firstPostAt: string | null = null;
  let lastPublishedAt: string | null = null;
  let totalReadsAllTime = 0;
  let readsLast30d = 0;
  let subscribers = 0;

  if (isSanityConfigured) {
    try {
      const [count, firstPub, lastPub] = await Promise.all([
        client.fetch<number>(
          `count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())])`,
        ),
        client.fetch<string | null>(
          `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] | order(publishedAt asc) [0].publishedAt`,
        ),
        client.fetch<string | null>(
          `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] | order(publishedAt desc) [0].publishedAt`,
        ),
      ]);
      totalPosts = count ?? 0;
      firstPostAt = firstPub ?? null;
      lastPublishedAt = lastPub ?? null;
    } catch {
      // Sanity unreachable — keep zeros.
    }
  }

  try {
    const since = subDays(new Date(), 30);
    const [allTime, last30, subCount] = await Promise.all([
      prisma.postView.aggregate({ _sum: { count: true } }),
      prisma.postView.aggregate({
        where: { updatedAt: { gte: since } },
        _sum: { count: true },
      }),
      prisma.newsletterSubscriber.count({ where: { confirmed: true } }),
    ]);
    totalReadsAllTime = allTime._sum.count ?? 0;
    readsLast30d = last30._sum.count ?? 0;
    subscribers = subCount;
  } catch {
    // Postgres unreachable or missing tables — keep zeros.
  }

  const yearsActive = firstPostAt
    ? Math.max(1, Math.round(
        (Date.now() - new Date(firstPostAt).getTime()) / (365.25 * 86_400_000),
      ))
    : 0;

  return {
    totalPosts,
    totalReadsAllTime,
    readsLast30d,
    subscribers,
    firstPostAt,
    lastPublishedAt,
    yearsActive,
  };
}
