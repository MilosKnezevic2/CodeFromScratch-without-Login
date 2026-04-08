import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  categories: { title: string; slug: { current: string } }[];
  tags: { title: string; slug: { current: string } }[] | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!isSanityConfigured) {
    return NextResponse.json({ groups: [] });
  }

  // 1. Get current post's categories AND tags
  const currentPost = await client.fetch<{
    _id: string;
    categories: { title: string; slug: { current: string } }[];
    tags: { title: string; slug: { current: string } }[] | null;
  } | null>(
    `*[_type == "post" && slug.current == $slug && status == "published"][0] {
      _id,
      categories[]->{ title, slug },
      tags[]->{ title, slug }
    }`,
    { slug }
  );

  if (!currentPost) {
    return NextResponse.json({ groups: [] });
  }

  const categorySlugs = currentPost.categories?.map((c) => c.slug.current) || [];
  const tagSlugs = currentPost.tags?.map((t) => t.slug.current) || [];
  const currentCategoryTitle = currentPost.categories?.[0]?.title || "Related";

  // 2. Exclude already-read posts for logged-in users
  const session = await auth();
  let readSlugs: string[] = [];

  if (session?.user?.id) {
    const history = await prisma.readingHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { readAt: "desc" },
      take: 100,
      select: { postSlug: true },
    });
    readSlugs = history.map((h) => h.postSlug);
  }

  // 3. Fetch all posts with categories and tags
  const allPosts = await client.fetch<SanityPost[]>(
    `*[_type == "post" && status == "published" && _id != $postId] | order(publishedAt desc) {
      _id, title, slug, publishedAt,
      categories[]->{ title, slug },
      tags[]->{ title, slug }
    }`,
    { postId: currentPost._id }
  );

  const available = allPosts.filter(
    (p) => p.slug.current !== slug && !readSlugs.includes(p.slug.current)
  );

  // 4. Score posts by relevance (categories + tags overlap)
  const scored = available.map((post) => {
    let score = 0;
    const postCats = post.categories?.map((c) => c.slug.current) || [];
    const postTags = post.tags?.map((t) => t.slug.current) || [];

    // Same category = +3 per match
    for (const cs of categorySlugs) {
      if (postCats.includes(cs)) score += 3;
    }
    // Same tag = +2 per match
    for (const ts of tagSlugs) {
      if (postTags.includes(ts)) score += 2;
    }

    return { post, score };
  });

  // 5. Sort by score — top ones are "related"
  scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

  // Related = score > 0 (share category or tag)
  const related = scored.filter((s) => s.score > 0).map((s) => s.post);
  // Unrelated = score 0
  const unrelated = scored.filter((s) => s.score === 0).map((s) => s.post);

  // 6. Build groups: 3 related + 1 random from different category
  const relatedPicks = related
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((p) => ({ _id: p._id, title: p.title, slug: p.slug }));

  // Pick 1 random from a category we haven't shown
  const usedIds = new Set(relatedPicks.map((p) => p._id));
  const randomPool = unrelated.filter((p) => !usedIds.has(p._id));

  let randomGroup: { category: string; post: { _id: string; title: string; slug: { current: string } } } | null = null;
  if (randomPool.length > 0) {
    const pick = randomPool[Math.floor(Math.random() * randomPool.length)];
    randomGroup = {
      category: pick.categories?.[0]?.title || "More",
      post: { _id: pick._id, title: pick.title, slug: pick.slug },
    };
  }

  const groups = [];

  if (relatedPicks.length > 0) {
    groups.push({
      category: currentCategoryTitle,
      posts: relatedPicks,
    });
  }

  if (randomGroup) {
    groups.push({
      category: randomGroup.category,
      posts: [randomGroup.post],
    });
  }

  return NextResponse.json({ groups });
}
