import { NextResponse } from "next/server";
import { instantSearch } from "@/lib/sanity/queries";

export const dynamic = "force-dynamic";

/**
 * Lightweight server-side fuzzy search backing the ⌘K palette.
 * Returns the top N matches by recent publish date for a partial
 * query. Cap query length and result count so a malicious caller
 * can't enumerate the catalog cheaply.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (query.length < 2) {
    return NextResponse.json({ posts: [] });
  }
  const posts = await instantSearch(query, 8);
  return NextResponse.json(
    { posts },
    {
      headers: {
        "Cache-Control": "private, max-age=10",
      },
    },
  );
}
