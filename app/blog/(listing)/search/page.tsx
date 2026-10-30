import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import BlogListing, { LISTING_DESCRIPTION, LISTING_TITLE } from "@/components/blog/listing/BlogListing";
import { listingHref, queryFromParams, type ListingQuery } from "@/lib/blog-url";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * Searches, re-sorts, combined filters and their pages: an endless set of
 * thin views of the static journal, so this route never enters the index. A
 * state that has a page of its own (plain, lone category, lone tag) is sent
 * there instead of being rendered here.
 */
function canonicalFor(query: ListingQuery): string {
  return `${SITE_URL}${listingHref(query)}`;
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = queryFromParams(await searchParams);
  const title = query.q ? `Search: ${query.q}` : LISTING_TITLE;
  return {
    title,
    description: LISTING_DESCRIPTION,
    robots: { index: false, follow: true },
    alternates: { canonical: canonicalFor(query) },
  };
}

export default async function BlogSearchPage({ searchParams }: { searchParams: SearchParams }) {
  const query = queryFromParams(await searchParams);
  const home = listingHref(query);
  if (!home.startsWith("/blog/search")) permanentRedirect(home);
  return <BlogListing query={query} canonicalUrl={canonicalFor(query)} />;
}
