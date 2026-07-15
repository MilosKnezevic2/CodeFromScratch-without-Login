import { client } from "@/lib/sanity/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: FeedPost[];
  try {
    posts = await client.fetch<FeedPost[]>(
      `*[_type == "post" && status == "published" && (!defined(publishedAt) || publishedAt <= now())] | order(publishedAt desc) [0...50] {
        _id, title, slug, excerpt, publishedAt, _updatedAt, author->{ name }, categories[]->{ title }
      }`,
    );
  } catch {
    // Sanity unreachable — a 503 tells feed readers to keep their cached
    // items and retry, where an empty 200 feed would wipe them.
    return new Response("Feed temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "300" },
    });
  }

  const updated =
    posts.length > 0
      ? new Date(posts[0]?._updatedAt ?? posts[0]?.publishedAt ?? Date.now()).toISOString()
      : new Date().toISOString();

  const entries = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug.current}`;
      return `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${url}"/>
    <id>${url}</id>
    <published>${new Date(post.publishedAt).toISOString()}</published>
    <updated>${new Date(post._updatedAt ?? post.publishedAt).toISOString()}</updated>${
      post.author?.name
        ? `\n    <author><name>${escapeXml(post.author.name)}</name></author>`
        : ""
    }${
      post.categories
        ?.map(
          (c) => `\n    <category term="${escapeXml(c.title)}"/>`,
        )
        .join("") ?? ""
    }${
      post.excerpt
        ? `\n    <summary>${escapeXml(post.excerpt)}</summary>`
        : ""
    }
  </entry>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>CodeFromScratch Blog</title>
  <subtitle>Web development tutorials, guides, and resources.</subtitle>
  <link href="${SITE_URL}/blog/atom.xml" rel="self" type="application/atom+xml"/>
  <link href="${SITE_URL}/blog" rel="alternate" type="text/html"/>
  <id>${SITE_URL}/blog</id>
  <updated>${updated}</updated>
${entries}
</feed>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
