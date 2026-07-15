import "server-only";
import { client } from "./client";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export type BlogHeroStats = {
  totalPosts: number;
  lastPublishedAt: string | null;
  lastUpdatedAt: string | null;
  readsLast30d: number;
};

/**
 * Live stats shown in the blog index hero — total published posts,
 * the timestamp of the most recent publish, and a 30-day reader
 * volume number for social proof. Tolerant of missing infra
 * (Sanity not configured, PostView table missing) so the hero
 * always renders.
 */
export async function getBlogHeroStats(): Promise<BlogHeroStats> {
  if (!isSanityConfigured) {
    return {
      totalPosts: 0,
      lastPublishedAt: null,
      lastUpdatedAt: null,
      readsLast30d: 0,
    };
  }
  let totalPosts = 0;
  let lastPublishedAt: string | null = null;
  let lastUpdatedAt: string | null = null;
  let readsLast30d = 0;

  try {
    const [count, latestPublish, latestUpdate] = await Promise.all([
      client.fetch<number>(
        `count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())])`,
      ),
      client.fetch<string | null>(
        `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] | order(publishedAt desc) [0].publishedAt`,
      ),
      client.fetch<string | null>(
        `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] | order(_updatedAt desc) [0]._updatedAt`,
      ),
    ]);
    totalPosts = count ?? 0;
    lastPublishedAt = latestPublish ?? null;
    lastUpdatedAt = latestUpdate ?? null;
  } catch {
    // Sanity unreachable — keep zeros.
  }

  try {
    const since = subDays(new Date(), 30);
    const result = await prisma.postView.aggregate({
      where: { updatedAt: { gte: since } },
      _sum: { count: true },
    });
    readsLast30d = result._sum.count ?? 0;
  } catch {
    // PostView table missing or unreachable — keep zero.
  }

  return { totalPosts, lastPublishedAt, lastUpdatedAt, readsLast30d };
}
