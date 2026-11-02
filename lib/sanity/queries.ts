import { cache } from "react";
import { client } from "./client";
import type { ReadingCandidate } from "@/lib/blog/keep-reading";
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
  _updatedAt?: string;
  contentUpdatedAt?: string;
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
  _updatedAt,
  contentUpdatedAt,
  readingTime
`;

export type PostsAdvancedQuery = {
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest";
  category?: string;
  tag?: string;
  search?: string;
  readingTime?: "short" | "medium" | "long";
  difficulty?: "beginner" | "intermediate" | "advanced";
};

/**
 * Single-entry query that composes all blog-index filters server-side
 * (category, tag, free-text search, reading-time bucket, difficulty).
 * Returns the same shape as getPosts so it drops in everywhere the
 * older helpers are used.
 */
export async function getPostsAdvanced(q: PostsAdvancedQuery) {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const page = q.page ?? 1;
  const limit = q.limit ?? 10;
  const start = (page - 1) * limit;

  const clauses: string[] = [
    `_type == "post"`,
    `status == "published" && (!defined(publishedAt) || publishedAt <= now())`,
  ];
  const params: Record<string, string | number> = {};
  if (q.category) {
    clauses.push(`$categorySlug in categories[]->slug.current`);
    params.categorySlug = q.category;
  }
  if (q.tag) {
    clauses.push(`$tagSlug in tags[]->slug.current`);
    params.tagSlug = q.tag;
  }
  if (q.search && q.search.length >= 2) {
    clauses.push(`(title match $searchTerm || excerpt match $searchTerm)`);
    params.searchTerm = `${q.search}*`;
  }
  if (q.readingTime) {
    if (q.readingTime === "short") clauses.push(`readingTime <= 5`);
    else if (q.readingTime === "medium")
      clauses.push(`readingTime > 5 && readingTime <= 12`);
    else if (q.readingTime === "long") clauses.push(`readingTime > 12`);
  }
  if (q.difficulty) {
    clauses.push(`difficulty == $difficulty`);
    params.difficulty = q.difficulty;
  }

  const filter = clauses.join(" && ");
  const orderClause =
    q.sort === "oldest" ? "order(publishedAt asc)" : "order(publishedAt desc)";

  const [posts, total] = await Promise.all([
    client.fetch<SanityPost[]>(
      `*[${filter}] | ${orderClause} [${start}...${start + limit}] { ${postFields} }`,
      params,
    ),
    client.fetch<number>(`count(*[${filter}])`, params),
  ]);
  return { posts, total, pages: Math.ceil(total / limit) };
}

export async function getPosts(page = 1, limit = 10, sort: "newest" | "oldest" = "newest") {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const orderClause = sort === "oldest" ? "order(publishedAt asc)" : "order(publishedAt desc)";
  const posts = await client.fetch<SanityPost[]>(
    `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] | ${orderClause} [${start}...${start + limit}] { ${postFields} }`
  );
  const total = await client.fetch<number>(
    `count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())])`
  );
  return { posts, total, pages: Math.ceil(total / limit) };
}

export const getPostBySlug = cache(async (slug: string) => {
  if (!isSanityConfigured) return null;
  return client.fetch<SanityPost | null>(
    `*[_type == "post" && slug.current == $slug && status == "published" && (!defined(publishedAt) || publishedAt <= now())][0] { ${postFields} }`,
    { slug }
  );
});

export async function getPostsByCategory(categorySlug: string, page = 1, limit = 10) {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    client.fetch<SanityPost[]>(
      `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && $categorySlug in categories[]->slug.current] | order(publishedAt desc) [${start}...${start + limit}] { ${postFields} }`,
      { categorySlug }
    ),
    client.fetch<number>(
      `count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && $categorySlug in categories[]->slug.current])`,
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
      `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && $tagSlug in tags[]->slug.current] | order(publishedAt desc) [${start}...${start + limit}] { ${postFields} }`,
      { tagSlug }
    ),
    client.fetch<number>(
      `count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && $tagSlug in tags[]->slug.current])`,
      { tagSlug }
    ),
  ]);
  return { posts, total, pages: Math.ceil(total / limit) };
}

export type InstantSearchPost = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  category?: string;
  readingTime?: number;
};

export async function instantSearch(
  query: string,
  limit = 8,
): Promise<InstantSearchPost[]> {
  if (!isSanityConfigured || query.length < 2) return [];
  const filter = `_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && (title match $q || excerpt match $q)`;
  return client.fetch<InstantSearchPost[]>(
    `*[${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, excerpt, readingTime,
      "category": categories[0]->title
    }`,
    { q: `${query}*` } as Record<string, string>,
  );
}

export type AuthorWithPostCount = {
  _id: string;
  name: string;
  slug?: { current: string };
  image?: { asset: { _ref: string } };
  bio?: string;
  postCount: number;
};

export async function getFeaturedAuthors(
  limit = 6,
): Promise<AuthorWithPostCount[]> {
  if (!isSanityConfigured) return [];
  return client.fetch<AuthorWithPostCount[]>(
    `*[_type == "author"]{
      _id, name, slug, image, bio,
      "postCount": count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && references(^._id)])
    } | order(postCount desc) [0...$limit][postCount > 0]`,
    { limit },
  );
}

export async function searchPosts(query: string, page = 1, limit = 10) {
  if (!isSanityConfigured || query.length < 2) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const filter = `_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && (title match $q || excerpt match $q)`;
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
      "postCount": count(*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && references(^._id)])
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
      `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && publishedAt < $publishedAt] | order(publishedAt desc) [0] { title, slug }`,
      { publishedAt }
    ),
    client.fetch<AdjacentPost | null>(
      `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && publishedAt > $publishedAt] | order(publishedAt asc) [0] { title, slug }`,
      { publishedAt }
    ),
  ]);

  return { prev, next };
}

/** Every other published article with what a reading card needs; lib/blog/keep-reading.ts picks from these. */
export async function getKeepReadingCandidates(postId: string): Promise<ReadingCandidate[]> {
  if (!isSanityConfigured) return [];
  return client.fetch<ReadingCandidate[]>(
    `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now()) && _id != $postId] | order(publishedAt desc) {
      _id, title, slug, excerpt, readingTime, publishedAt, featuredImage,
      categories[]->{ title, slug },
      tags[]->{ slug }
    }`,
    { postId }
  );
}

export async function getAllPostSlugs() {
  if (!isSanityConfigured) return [];
  return client.fetch<{ slug: { current: string }; publishedAt?: string; contentUpdatedAt?: string }[]>(
    `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] { slug, publishedAt, contentUpdatedAt }`
  );
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
