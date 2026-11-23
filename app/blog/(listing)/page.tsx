import type { Metadata } from "next";
import BlogFront, { FRONT_DESCRIPTION, FRONT_TITLE } from "@/components/blog/front/BlogFront";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

/**
 * The journal's front page, laid out like a magazine (BlogFront). It reads no
 * query string on purpose: that keeps it prerendered and served from the
 * edge cache, while /blog/area/*, /blog/category/*, /blog/page/N and
 * /blog/search?... hold every other view. Old /blog?page=2 style addresses
 * are redirected by the proxy.
 */
// Rebuilt once a day at most; a publish refreshes it at once through
// /api/revalidate (Sanity webhook). Every-minute timers kept Vercel functions
// busy around the clock and got the Hobby plan paused on 2026-11-23.
export const revalidate = 86400;

export const metadata: Metadata = {
  // Root layout template appends "| CodeFromScratch" — pass the bare name
  // here or the brand doubles in the tab title.
  title: FRONT_TITLE,
  description: FRONT_DESCRIPTION,
  openGraph: {
    title: `${FRONT_TITLE} | CodeFromScratch`,
    description: FRONT_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    type: "website",
    siteName: "CodeFromScratch",
    locale: "en_US",
    images: [{ url: `${SITE_URL}/brand/og-default.png`, width: 1200, height: 630 }],
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: {
      "application/rss+xml": `${SITE_URL}/blog/rss.xml`,
      "application/atom+xml": `${SITE_URL}/blog/atom.xml`,
      "application/feed+json": `${SITE_URL}/blog/feed.json`,
    },
  },
};

export default function BlogPage() {
  return <BlogFront />;
}
