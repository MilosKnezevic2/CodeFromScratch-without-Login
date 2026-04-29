import { client } from "@/lib/sanity/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type FeedPost = {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  publishedAt: string;
  _updatedAt?: string;
  author?: { name?: string };
  categories?: { title: string }[];
};

export async function GET() {
  const posts = await client.fetch<FeedPost[]>(
    `*[_type == "post" && status == "published"] | order(publishedAt desc) [0...50] {
      _id, title, slug, excerpt, publishedAt, _updatedAt, author->{ name }, categories[]->{ title }
    }`,
  );

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "CodeFromScratch Blog",
    home_page_url: `${SITE_URL}/blog`,
    feed_url: `${SITE_URL}/blog/feed.json`,
    description:
      "Web development tutorials, guides, and resources from CodeFromScratch.",
    language: "en",
    icon: `${SITE_URL}/logo.svg`,
    items: posts.map((post) => ({
      id: `${SITE_URL}/blog/${post.slug.current}`,
      url: `${SITE_URL}/blog/${post.slug.current}`,
      title: post.title,
      content_text: post.excerpt ?? "",
      summary: post.excerpt ?? "",
      date_published: post.publishedAt,
      ...(post._updatedAt ? { date_modified: post._updatedAt } : {}),
      ...(post.author?.name
        ? { authors: [{ name: post.author.name }] }
        : {}),
      ...(post.categories
        ? { tags: post.categories.map((c) => c.title) }
        : {}),
    })),
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
