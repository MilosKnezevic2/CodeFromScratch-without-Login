import { cache } from "react";
import { client } from "./client";
import type { PortableTextBlock } from "@portabletext/react";

const isSanityConfigured = !!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

// Post types
export interface SanityPost {
  _id: string;
  title: string;
  slug: { current: string };
  author?: { name: string; image?: { asset: { _ref: string } }; bio?: string };
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
  author->{ name, image, bio },
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

export async function getPosts(page = 1, limit = 10) {
  if (!isSanityConfigured) return { posts: [], total: 0, pages: 0 };
  const start = (page - 1) * limit;
  const posts = await client.fetch<SanityPost[]>(
    `*[_type == "post" && status == "published"] | order(publishedAt desc) [${start}...${start + limit}] { ${postFields} }`
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
  return client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "post" && status == "published"] { slug }`
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
