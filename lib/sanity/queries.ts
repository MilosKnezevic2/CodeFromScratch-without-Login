import { cache } from "react";
import { client } from "./client";
import type { PortableTextBlock } from "@portabletext/react";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

// Post types
export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  author?: { name: string; image?: { asset: { _ref: string } }; bio?: string; twitter?: string; github?: string; website?: string; linkedin?: string };
  excerpt?: string;
  featuredImage?: { asset: { _ref: string }; alt?: string };
  content: PortableTextBlock[];
  categories?: { title: string; slug: { current: string } }[];
  tags?: { title: string; slug: { current: string } }[];
  isPremium: boolean;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt: string;
  readingTime?: number;
}

export interface SanityCategory {
  _id: string;
  title: string;
  slug: { current: string };
  description?: string;
}

export interface SanityEbook {
  _id: string;
  title: string;
  slug: { current: string };
  description: string;
  coverImage?: { asset: { _ref: string } };
  previewContent?: PortableTextBlock[];
  price: number;
  freeWithPro: boolean;
}

const postFields = `
  _id,
  title,
  slug,
  author->{ name, image, bio, twitter, github, website, linkedin },
  excerpt,
  featuredImage,
  content,
  categories[]->{ title, slug },
  tags[]->{ title, slug },
  isPremium,
  seoTitle,
  seoDescription,
  publishedAt,
  readingTime
`;

export async function getPosts(page = 1, limit = 10, sort: "newest" | "oldest" = "newest") {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const orderClause = sort === "oldest" ? "order(publishedAt asc)" : "order(publishedAt desc)";
  const posts = await client.fetch<SanityPost[]>(
    `*[_type == "post" && status == "published"] | ${orderClause} [${start}...${start + limit}] { ${postFields} }`
  );
  const total = await client.fetch<number>(
    `count(*[_type == "post" && status == "published"])`
  );
  return { posts, total, pages: Math.ceil(total / limit) };
}

export const getPostBySlug = cache(async (slug: string) => {
  if (!isSanityConfigured) return null;
  return client.fetch<SanityPost | null>(
    `*[_type == "post" && slug.current == $slug && status == "published"][0] { ${postFields} }`,
    { slug }
  );
});

export async function getPostsByCategory(categorySlug: string, page = 1, limit = 10) {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    client.fetch<SanityPost[]>(
      `*[_type == "post" && status == "published" && $categorySlug in categories[]->slug.current] | order(publishedAt desc) [${start}...${start + limit}] { ${postFields} }`,
      { categorySlug }
    ),
    client.fetch<number>(
      `count(*[_type == "post" && status == "published" && $categorySlug in categories[]->slug.current])`,
      { categorySlug }
    ),
  ]);
  return { posts, total, pages: Math.ceil(total / limit) };
}

export async function getPostsByTag(tagSlug: string, page = 1, limit = 10) {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    client.fetch<SanityPost[]>(
      `*[_type == "post" && status == "published" && $tagSlug in tags[]->slug.current] | order(publishedAt desc) [${start}...${start + limit}] { ${postFields} }`,
      { tagSlug }
    ),
    client.fetch<number>(
      `count(*[_type == "post" && status == "published" && $tagSlug in tags[]->slug.current])`,
      { tagSlug }
    ),
  ]);
  return { posts, total, pages: Math.ceil(total / limit) };
}

export async function searchPosts(query: string, page = 1, limit = 10) {
  if (!isSanityConfigured || query.length < 2) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const filter = `_type == "post" && status == "published" && (title match $q || excerpt match $q)`;
  const [posts, total] = await Promise.all([
    client.fetch<SanityPost[]>(
      `*[${filter}] | order(publishedAt desc) [${start}...${start + limit}] { ${postFields} }`,
      { q: `${query}*` } as Record<string, string>
    ),
    client.fetch<number>(
      `count(*[${filter}])`,
      { q: `${query}*` } as Record<string, string>
    ),
  ]);
  return { posts, total, pages: Math.ceil(total / limit) };
}

export interface TagWithCategory {
  _id: string;
  title: string;
  slug: { current: string };
  categorySlug: string | null;
}

export async function getTagsWithCategory() {
  if (!isSanityConfigured) return [];
  return client.fetch<TagWithCategory[]>(
    `*[_type == "tag"] {
      _id, title, slug,
      "categorySlug": category->slug.current
    } | order(title asc)`
  );
}

export async function getRelatedPosts(postId: string, categories: string[], limit = 3) {
  if (!isSanityConfigured) return [];
  return client.fetch<SanityPost[]>(
    `*[_type == "post" && status == "published" && _id != $postId && count((categories[]->slug.current)[@ in $categories]) > 0] | order(publishedAt desc) [0...$limit] { ${postFields} }`,
    { postId, categories, limit }
  );
}

export async function getCategories() {
  if (!isSanityConfigured) return [];
  return client.fetch<SanityCategory[]>(
    `*[_type == "category"] | order(title asc) { _id, title, slug, description }`
  );
}

export interface CategoryWithCount {
  _id: string;
  title: string;
  slug: { current: string };
  postCount: number;
}

export async function getCategoriesWithCounts() {
  if (!isSanityConfigured) return [];
  return client.fetch<CategoryWithCount[]>(
    `*[_type == "category"] {
      _id, title, slug,
      "postCount": count(*[_type == "post" && status == "published" && references(^._id)])
    } | order(postCount desc, title asc)`
  );
}

export async function getEbooks() {
  if (!isSanityConfigured) return [];
  return client.fetch<SanityEbook[]>(
    `*[_type == "ebook"] | order(_createdAt desc) { _id, title, slug, description, coverImage, price, freeWithPro }`
  );
}

export async function getEbookBySlug(slug: string) {
  if (!isSanityConfigured) return null;
  return client.fetch<SanityEbook | null>(
    `*[_type == "ebook" && slug.current == $slug][0] { _id, title, slug, description, coverImage, previewContent, price, freeWithPro }`,
    { slug }
  );
}

export interface AdjacentPost {
  title: string;
  slug: { current: string };
}

export async function getAdjacentPosts(publishedAt: string) {
  if (!isSanityConfigured) return { prev: null, next: null };

  const [prev, next] = await Promise.all([
    client.fetch<AdjacentPost | null>(
      `*[_type == "post" && status == "published" && publishedAt < $publishedAt] | order(publishedAt desc) [0] { title, slug }`,
      { publishedAt }
    ),
    client.fetch<AdjacentPost | null>(
      `*[_type == "post" && status == "published" && publishedAt > $publishedAt] | order(publishedAt asc) [0] { title, slug }`,
      { publishedAt }
    ),
  ]);

  return { prev, next };
}

export async function getAllPostSlugs() {
  if (!isSanityConfigured) return [];
  return client.fetch<{ slug: { current: string }; publishedAt?: string }[]>(
    `*[_type == "post" && status == "published"] { slug, publishedAt }`
  );
}

export interface SuggestedPostsByCategory {
  category: { title: string; slug: { current: string } };
  posts: Pick<SanityPost, "_id" | "title" | "slug" | "publishedAt">[];
}

export async function getSuggestedPosts(
  currentPostId: string,
  currentCategorySlugs: string[],
  limit = 4
) {
  if (!isSanityConfigured) return [];

  // Single query — fetch recent posts with their categories
  const posts = await client.fetch<
    { _id: string; title: string; slug: { current: string }; publishedAt: string; categories: { title: string; slug: { current: string } }[] }[]
  >(
    `*[_type == "post" && status == "published" && _id != $postId] | order(publishedAt desc) [0...15] {
      _id, title, slug, publishedAt,
      categories[]->{ title, slug }
    }`,
    { postId: currentPostId }
  );

  // Group posts by category in JS
  const grouped = new Map<string, SuggestedPostsByCategory>();
  for (const post of posts) {
    if (!post.categories) continue;
    for (const cat of post.categories) {
      const key = cat.slug.current;
      let group = grouped.get(key);
      if (!group) {
        group = { category: cat, posts: [] };
        grouped.set(key, group);
      }
      if (group.posts.length < limit) {
        group.posts.push({ _id: post._id, title: post.title, slug: post.slug, publishedAt: post.publishedAt });
      }
    }
  }

  const results = [...grouped.values()];

  // Sort so current post's categories come first
  results.sort((a, b) => {
    const aMatch = currentCategorySlugs.includes(a.category.slug.current) ? 0 : 1;
    const bMatch = currentCategorySlugs.includes(b.category.slug.current) ? 0 : 1;
    return aMatch - bMatch;
  });

  return results;
}

export interface PostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  featuredImage?: { asset: { _ref: string }; alt?: string };
  categories?: { title: string; slug: { current: string } }[];
  readingTime?: number;
  publishedAt: string;
}

export async function getPostsBySlugList(slugs: string[]): Promise<PostSummary[]> {
  if (!isSanityConfigured || slugs.length === 0) return [];
  return client.fetch<PostSummary[]>(
    `*[_type == "post" && slug.current in $slugs] {
      _id, title, slug, excerpt, featuredImage, categories[]->{ title, slug }, readingTime, publishedAt
    }`,
    { slugs }
  );
}

export interface SidebarSuggestionGroup {
  category: string;
  posts: { _id: string; title: string; slug: { current: string } }[];
}

export async function getSidebarSuggestions(
  postId: string,
  categorySlugs: string[],
  tagSlugs: string[],
  categoryTitle: string
): Promise<SidebarSuggestionGroup[]> {
  if (!isSanityConfigured) return [];

  const allPosts = await client.fetch<
    { _id: string; title: string; slug: { current: string }; categories: { title: string; slug: { current: string } }[]; tags: { slug: { current: string } }[] | null }[]
  >(
    `*[_type == "post" && status == "published" && _id != $postId] | order(publishedAt desc) {
      _id, title, slug,
      categories[]->{ title, slug },
      tags[]->{ slug }
    }`,
    { postId }
  );

  // Score by category + tag overlap
  const scored = allPosts.map((post) => {
    let score = 0;
    const postCats = post.categories?.map((c) => c.slug.current) || [];
    const postTags = post.tags?.map((t) => t.slug.current) || [];
    for (const cs of categorySlugs) { if (postCats.includes(cs)) score += 3; }
    for (const ts of tagSlugs) { if (postTags.includes(ts)) score += 2; }
    return { post, score };
  });

  const related = scored.filter((s) => s.score > 0).map((s) => s.post);
  const unrelated = scored.filter((s) => s.score === 0).map((s) => s.post);

  // Shuffle
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const relatedPicks = shuffle(related).slice(0, 3).map((p) => ({
    _id: p._id, title: p.title, slug: p.slug,
  }));

  const usedIds = new Set(relatedPicks.map((p) => p._id));

  // Group unrelated posts by category
  const byCat = new Map<string, { title: string; posts: typeof allPosts }>();
  for (const post of unrelated) {
    if (usedIds.has(post._id)) continue;
    const cat = post.categories?.[0];
    if (!cat) continue;
    const key = cat.slug.current;
    if (!byCat.has(key)) byCat.set(key, { title: cat.title, posts: [] });
    byCat.get(key)!.posts.push(post);
  }

  // Pick 2 random categories, each with 2 posts
  const catEntries = shuffle([...byCat.entries()].filter(([, g]) => g.posts.length >= 2));
  // Fallback: also allow categories with 1 post if not enough with 2
  const catEntriesFallback = shuffle([...byCat.entries()].filter(([, g]) => g.posts.length >= 1));
  const pickedCats = catEntries.slice(0, 2);
  // If we don't have 2 categories with 2+ posts, fill from fallback
  if (pickedCats.length < 2) {
    for (const entry of catEntriesFallback) {
      if (pickedCats.length >= 2) break;
      if (!pickedCats.some(([k]) => k === entry[0])) pickedCats.push(entry);
    }
  }

  const groups: SidebarSuggestionGroup[] = [];

  if (relatedPicks.length > 0) {
    groups.push({ category: categoryTitle, posts: relatedPicks });
  }

  for (const [, group] of pickedCats) {
    const picks = shuffle(group.posts).slice(0, 2).map((p) => ({
      _id: p._id, title: p.title, slug: p.slug,
    }));
    groups.push({ category: group.title, posts: picks });
  }

  return groups;
}
