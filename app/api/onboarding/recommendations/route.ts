import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/sanity/client";

export async function GET(request: NextRequest) {
  const categorySlugs = request.nextUrl.searchParams.get("categories")?.split(",").filter(Boolean) || [];

  if (categorySlugs.length === 0) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await client.fetch(
    `*[_type == "post" && status == "published" && count((categories[]->slug.current)[@ in $cats]) > 0] | order(publishedAt desc) [0...5] {
      _id, title, slug, excerpt, readingTime, categories[]->{ title }
    }`,
    { cats: categorySlugs }
  );

  return NextResponse.json({ posts });
}
