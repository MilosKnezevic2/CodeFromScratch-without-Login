import "server-only";
import { client } from "./client";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import type { SanityPost } from "./queries";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

const compactPostFields = `
  _id,
  title,
  slug,
  author->{ name, image },
  excerpt,
  featuredImage,
  categories[]->{ title, slug },
  isPremium,
  publishedAt,
  readingTime
`;

export type DiscoveryPost = Pick<
  SanityPost,
  | "_id"
  | "title"
  | "slug"
  | "author"
  | "excerpt"
  | "featuredImage"
  | "categories"
  | "isPremium"
  | "publishedAt"
  | "readingTime"
> & {
  viewCount?: number;
  updatedAt?: string;
};

/**
 * Top-N trending posts for a rolling window. Reads PostView counts
 * (Postgres) for slugs updated inside the window, then hydrates the
 * top slugs from Sanity. Tolerant of either side being unavailable —
 * returns empty arrays so the rail just disappears instead of breaking
 * the page.
 */
export async function getTrendingPosts(
  windowDays = 7,
  limit = 5,
): Promise<DiscoveryPost[]> {
  if (!isSanityConfigured) return [];
  let topSlugs: { slug: string; views: number }[] = [];
  try {
    const since = subDays(new Date(), windowDays);
    const rows = await prisma.postView.findMany({
      where: { updatedAt: { gte: since } },
      orderBy: { count: "desc" },
      take: limit * 2,
      select: { postSlug: true, count: true },
    });
    topSlugs = rows.map((r) => ({ slug: r.postSlug, views: r.count }));
  } catch {
    return [];
  }
  if (topSlugs.length === 0) return [];

  try {
    const slugs = topSlugs.map((s) => s.slug);
    const posts = await client.fetch<DiscoveryPost[]>(
      `*[_type == "post" && status == "published" && slug.current in $slugs] { ${compactPostFields} }`,
      { slugs },
    );
    // Sort to match the views ranking and attach the view count.
    const viewMap = new Map(topSlugs.map((s) => [s.slug, s.views]));
    return posts
      .map((p) => ({ ...p, viewCount: viewMap.get(p.slug.current) ?? 0 }))
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Operator-curated picks. Surfaces published posts where the
 * `editorPick` flag is set in Sanity, ordered by most recent.
 */
export async function getEditorPicks(limit = 3): Promise<DiscoveryPost[]> {
  if (!isSanityConfigured) return [];
  try {
    return await client.fetch<DiscoveryPost[]>(
      `*[_type == "post" && status == "published" && editorPick == true]
        | order(publishedAt desc) [0...$limit] { ${compactPostFields} }`,
      { limit },
    );
  } catch {
    return [];
  }
}

/**
 * Posts whose `_updatedAt` is meaningfully newer than `publishedAt`,
 * suggesting a real refresh (typo fixes do not count). Useful as a
 * "Recently refreshed" rail so evergreen content is rediscovered.
 */
export async function getRecentlyUpdatedPosts(
  windowDays = 14,
  limit = 4,
): Promise<DiscoveryPost[]> {
  if (!isSanityConfigured) return [];
  try {
    const since = subDays(new Date(), windowDays).toISOString();
    const rows = await client.fetch<(DiscoveryPost & { _updatedAt: string })[]>(
      `*[
        _type == "post"
        && status == "published"
        && _updatedAt > $since
        && _updatedAt > dateTime(publishedAt) + 60*60*24
      ] | order(_updatedAt desc) [0...$limit] {
        ${compactPostFields},
        _updatedAt
      }`,
      { since, limit },
    );
    return rows.map(({ _updatedAt, ...rest }) => ({
      ...rest,
      updatedAt: _updatedAt,
    }));
  } catch {
    return [];
  }
}
