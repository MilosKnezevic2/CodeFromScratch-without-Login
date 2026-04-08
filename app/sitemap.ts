import type { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/sanity/queries";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/ebooks`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/courses`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/pricing`, changeFrequency: "monthly", priority: 0.7 },
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

  // Ebooks
  let ebookPages: MetadataRoute.Sitemap = [];
  try {
    const ebooks = await prisma.ebook.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    ebookPages = ebooks.map((e) => ({
      url: `${baseUrl}/ebooks/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB may not be connected
  }

  return [...staticPages, ...postPages, ...ebookPages];
}
