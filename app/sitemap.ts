import type { MetadataRoute } from "next";
import { getAllPostSlugs } from "@/lib/sanity/queries";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const staticPages = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    { url: `${baseUrl}/ebooks`, lastModified: new Date() },
    { url: `${baseUrl}/pricing`, lastModified: new Date() },
    { url: `${baseUrl}/contact`, lastModified: new Date() },
  ];

  // Sanity blog posts
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllPostSlugs();
    postPages = slugs.map((s) => ({
      url: `${baseUrl}/blog/${s.slug.current}`,
      lastModified: new Date(),
    }));
  } catch {
    // Sanity may not be configured yet
  }

  // Ebooks
  let ebookPages: MetadataRoute.Sitemap = [];
  try {
    const ebooks = await prisma.ebook.findMany({
      where: { published: true },
      select: { slug: true },
    });
    ebookPages = ebooks.map((e) => ({
      url: `${baseUrl}/ebooks/${e.slug}`,
      lastModified: new Date(),
    }));
  } catch {
    // DB may not be connected
  }

  return [...staticPages, ...postPages, ...ebookPages];
}
