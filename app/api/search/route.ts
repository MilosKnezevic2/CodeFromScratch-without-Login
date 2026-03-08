import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/sanity/client";

interface SearchResult {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  categories?: { title: string }[];
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await client.fetch<SearchResult[]>(
    `*[_type == "post" && status == "published" && (title match $query || excerpt match $query)] | order(publishedAt desc) [0...10] {
      _id,
      title,
      slug,
      excerpt,
      categories[]->{ title }
    }`,
    { query: `${q}*` } as Record<string, string>
  );

  return NextResponse.json({ results });
}
