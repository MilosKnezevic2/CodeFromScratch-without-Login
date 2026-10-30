import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import BlogListing, { LISTING_DESCRIPTION, LISTING_TITLE } from "@/components/blog/listing/BlogListing";
import { BLOG_PAGE_SIZE, EMPTY_QUERY, parsePage } from "@/lib/blog-url";
import { buildSafe } from "@/lib/sanity/build-safe";
import { getPostsAdvanced } from "@/lib/sanity/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

/**
 * Pages 2 and up of the journal, prerendered like the first one. This route
 * sits outside the (listing) group on purpose: that group's loading.tsx would
 * stream a shell before notFound() runs and turn a missing page into a soft
 * 404 (see app/blog/(listing)/README.md).
 */
export const revalidate = 60;
export const dynamicParams = true;

type PageProps = { params: Promise<{ n: string }> };

export async function generateStaticParams() {
  const { pages } = await buildSafe(getPostsAdvanced({ page: 1, limit: BLOG_PAGE_SIZE }), { posts: [], total: 0, pages: 0 });
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = parsePage((await params).n);
  if (!page || page === 1) return { title: LISTING_TITLE };
  return {
    title: `${LISTING_TITLE}, page ${page}`,
    description: LISTING_DESCRIPTION,
    openGraph: {
      title: `${LISTING_TITLE}, page ${page} | CodeFromScratch`,
      description: LISTING_DESCRIPTION,
      url: `${SITE_URL}/blog/page/${page}`,
      type: "website",
      siteName: "CodeFromScratch",
      locale: "en_US",
      images: [{ url: `${SITE_URL}/brand/og-default.png`, width: 1200, height: 630 }],
    },
    alternates: { canonical: `${SITE_URL}/blog/page/${page}` },
  };
}

export default async function BlogPageN({ params }: PageProps) {
  const page = parsePage((await params).n);
  if (!page) notFound();
  if (page === 1) permanentRedirect("/blog");
  return <BlogListing query={{ ...EMPTY_QUERY, page }} canonicalUrl={`${SITE_URL}/blog/page/${page}`} notFoundWhenEmpty />;
}
