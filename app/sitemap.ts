import type { MetadataRoute } from "next";
import { AREAS, areaOfCategory, isIndexableList } from "@/lib/blog/front";
import { getAllPostSlugs, getCategoriesWithCounts, getFrontPosts } from "@/lib/sanity/queries";

// Refreshed by /api/revalidate the moment a post is published, and once a day
// otherwise. On 2026-11-02 the purge regenerated this route with a post
// missing: the pages read Sanity through its CDN, which still served the
// version from before the publish. The pages now read the API directly
// (lib/sanity/client.ts), so the purge sees the new post.
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

  // Content-first launch: the sitemap advertises only the public journal
  // surface. Ebooks / courses / pricing are hidden from navigation until the
  // commerce backend ships — re-add them here when those surfaces go public.
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/newsletter`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${baseUrl}/course-waitlist`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/write-for-us`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/impressum`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Sanity-backed URLs — each group degrades to empty when Sanity is
  // unreachable so the sitemap itself never 500s.
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllPostSlugs();
    postPages = slugs.map((s) => ({
      url: `${baseUrl}/blog/${s.slug.current}`,
      // A rewrite moves the date; a small edit does not, so crawlers see real changes only.
      lastModified: s.contentUpdatedAt ? new Date(s.contentUpdatedAt) : s.publishedAt ? new Date(s.publishedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sanity may not be configured yet
  }

  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategoriesWithCounts();
    categoryPages = categories
      .filter((c) => isIndexableList(c.postCount))
      .map((c) => ({
        url: `${baseUrl}/blog/category/${c.slug.current}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    // Sanity may not be configured yet
  }

  // Tag pages carry a noindex tag (thin lists), so advertising them here sent
  // Google two opposite signals for 101 of 154 URLs. Categories stay: they are
  // indexed and rank.
  // The journal's areas (lib/blog/front.ts): only those with enough articles to be indexed.
  let areaPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getFrontPosts();
    areaPages = AREAS.filter((a) => isIndexableList(posts.filter((p) => areaOfCategory(p.category?.slug) === a).length)).map((a) => ({
      url: `${baseUrl}/blog/area/${a.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Sanity may not be configured yet
  }

  return [...staticPages, ...postPages, ...areaPages, ...categoryPages];
}
