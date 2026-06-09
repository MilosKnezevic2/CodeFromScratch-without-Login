import type { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/sanity/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Content-first launch: the sitemap advertises only the public journal
  // surface. Ebooks / courses / pricing are hidden from navigation until the
  // commerce backend ships — re-add them here when those surfaces go public.
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/newsletter`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Sanity blog posts
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllPostSlugs();
    postPages = slugs.map((s) => ({
      url: `${baseUrl}/blog/${s.slug.current}`,
      lastModified: s.publishedAt ? new Date(s.publishedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    // Sanity may not be configured yet
  }

  return [...staticPages, ...postPages];
}
