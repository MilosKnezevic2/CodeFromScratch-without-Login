import "server-only";
import { client } from "./client";
import { prisma } from "@/lib/prisma";
import type { DiscoveryPost } from "./discovery";

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

export type ContinueReadingPost = DiscoveryPost & {
  scrollPercent: number;
  readAt: string;
};

export type SavedForLaterPost = DiscoveryPost & {
  savedAt: string;
};

/**
 * Posts the user has started but not finished, ordered by most
 * recent reading activity. Filters out posts the user has already
 * marked complete (`completedAt`) and posts that have rolled past
 * the 90-day reading-history retention window.
 */
export async function getContinueReading(
  userId: string,
  limit = 4,
): Promise<ContinueReadingPost[]> {
  if (!isSanityConfigured) return [];
  let history: { postSlug: string; scrollPercent: number; readAt: Date }[] = [];
  try {
    const rows = await prisma.readingHistory.findMany({
      where: {
        userId,
        completedAt: null,
        scrollPercent: { gt: 5, lt: 95 },
      },
      orderBy: { readAt: "desc" },
      take: limit,
      select: { postSlug: true, scrollPercent: true, readAt: true },
    });
    history = rows;
  } catch {
    return [];
  }
  if (history.length === 0) return [];

  try {
    const slugs = history.map((h) => h.postSlug);
    const posts = await client.fetch<DiscoveryPost[]>(
      `*[_type == "post" && status == "published" && slug.current in $slugs] { ${compactPostFields} }`,
      { slugs },
    );
    const byOrder = new Map(history.map((h, i) => [h.postSlug, i]));
    return posts
      .map((post) => {
        const entry = history.find((h) => h.postSlug === post.slug.current);
        return {
          ...post,
          scrollPercent: entry?.scrollPercent ?? 0,
          readAt: (entry?.readAt ?? new Date()).toISOString(),
        };
      })
      .sort(
        (a, b) =>
          (byOrder.get(a.slug.current) ?? 0) -
          (byOrder.get(b.slug.current) ?? 0),
      );
  } catch {
    return [];
  }
}

/**
 * The user's most-recently saved posts. Reads SavedPost rows,
 * hydrates from Sanity, and orders by save time desc.
 */
export async function getSavedForLater(
  userId: string,
  limit = 4,
): Promise<SavedForLaterPost[]> {
  if (!isSanityConfigured) return [];
  let saves: { postSlug: string; createdAt: Date }[] = [];
  try {
    const rows = await prisma.savedPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { postSlug: true, createdAt: true },
    });
    saves = rows;
  } catch {
    return [];
  }
  if (saves.length === 0) return [];

  try {
    const slugs = saves.map((s) => s.postSlug);
    const posts = await client.fetch<DiscoveryPost[]>(
      `*[_type == "post" && status == "published" && slug.current in $slugs] { ${compactPostFields} }`,
      { slugs },
    );
    const byOrder = new Map(saves.map((s, i) => [s.postSlug, i]));
    return posts
      .map((post) => {
        const save = saves.find((s) => s.postSlug === post.slug.current);
        return {
          ...post,
          savedAt: (save?.createdAt ?? new Date()).toISOString(),
        };
      })
      .sort(
        (a, b) =>
          (byOrder.get(a.slug.current) ?? 0) -
          (byOrder.get(b.slug.current) ?? 0),
      );
  } catch {
    return [];
  }
}

/**
 * The set of post slugs the current user has marked complete
 * (read-through). Used to optionally hide already-read posts from
 * the main feed.
 */
export async function getReadSlugs(userId: string): Promise<Set<string>> {
  try {
    const rows = await prisma.readingHistory.findMany({
      where: {
        userId,
        OR: [{ completedAt: { not: null } }, { scrollPercent: { gte: 90 } }],
      },
      select: { postSlug: true },
    });
    return new Set(rows.map((r) => r.postSlug));
  } catch {
    return new Set();
  }
}
