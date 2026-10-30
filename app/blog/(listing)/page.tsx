import type { Metadata } from "next";
import BlogListing, { LISTING_DESCRIPTION, LISTING_TITLE } from "@/components/blog/listing/BlogListing";
import { EMPTY_QUERY } from "@/lib/blog-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

/**
 * The journal's first page. It reads no query string on purpose: that keeps
 * it prerendered and served from the edge cache, while /blog/page/N holds the
 * rest and /blog/search?... every filtered view. Old /blog?page=2 style
 * addresses are redirected by the proxy.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  // Root layout template appends "| CodeFromScratch" — pass the bare name
  // here or the brand doubles in the tab title.
  title: LISTING_TITLE,
  description: LISTING_DESCRIPTION,
  openGraph: {
    title: `${LISTING_TITLE} | CodeFromScratch`,
    description: LISTING_DESCRIPTION,
    url: `${SITE_URL}/blog`,
    type: "website",
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
  return <BlogListing query={EMPTY_QUERY} canonicalUrl={`${SITE_URL}/blog`} />;
}
