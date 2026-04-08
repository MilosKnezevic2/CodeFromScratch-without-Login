import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import type { PostSummary } from "@/lib/sanity/queries";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

export async function getRecommendationsForUser(
  userId: string,
  limit = 5
): Promise<PostSummary[]> {
  if (!isSanityConfigured) return [];

  // 1. Get user interests
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { interests: true },
  });

  const interests = Array.isArray(user?.interests) ? (user.interests as string[]) : [];
  if (interests.length === 0) return [];

  // 2. Get slugs user has already read
  const readHistory = await prisma.readingHistory.findMany({
    where: { userId },
    select: { postSlug: true },
  });
  const readSlugs = readHistory.map((r) => r.postSlug);

  // 3. Query posts in interest categories, excluding already-read
  const posts = await client.fetch<PostSummary[]>(
    `*[_type == "post" && status == "published" && count((categories[]->slug.current)[@ in $interests]) > 0 && !(slug.current in $readSlugs)] | order(publishedAt desc) [0...$limit] {
      _id, title, slug, excerpt, featuredImage, categories[]->{ title, slug }, readingTime, publishedAt
    }`,
    { interests, readSlugs, limit }
  );

  return posts;
}

export async function getTrendingPosts(limit = 5): Promise<PostSummary[]> {
  if (!isSanityConfigured) return [];

  // Get top viewed posts from last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const topViewed = await prisma.postView.findMany({
    where: { updatedAt: { gte: weekAgo } },
    orderBy: { count: "desc" },
    take: limit,
    select: { postSlug: true },
  });

  const slugs = topViewed.map((v) => v.postSlug);
  if (slugs.length === 0) {
    // Fallback: just get recent posts
    return client.fetch<PostSummary[]>(
      `*[_type == "post" && status == "published"] | order(publishedAt desc) [0...$limit] {
        _id, title, slug, excerpt, featuredImage, categories[]->{ title, slug }, readingTime, publishedAt
      }`,
      { limit }
    );
  }

  return client.fetch<PostSummary[]>(
    `*[_type == "post" && status == "published" && slug.current in $slugs] {
      _id, title, slug, excerpt, featuredImage, categories[]->{ title, slug }, readingTime, publishedAt
    }`,
    { slugs }
  );
}
