import { client } from "@/lib/sanity/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";

/** Escape XML special characters in attribute / text contexts. */
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Make a string safe to embed inside a CDATA section. CDATA only has one
 *  forbidden sequence (`]]>`) — split it so it can't terminate the block. */
function cdataSafe(s: string): string {
  return s.replace(/]]>/g, "]]]]><![CDATA[>");
}

export async function GET() {
  let posts: {
    title: string;
    slug: { current: string };
    excerpt?: string;
    publishedAt: string;
    categories?: { title: string }[];
  }[];
  try {
    posts = await client.fetch(
      `*[_type == "post" && status == "published"] | order(publishedAt desc) [0...100] {
        title, slug, excerpt, publishedAt, categories[]->{ title }
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

  const lastBuildDate =
    posts.length > 0
      ? new Date(posts[0].publishedAt).toUTCString()
      : new Date().toUTCString();

  const items = posts
    .map((post) => {
      const link = `${SITE_URL}/blog/${post.slug.current}`;
      const excerpt = post.excerpt ?? "";
      return `
    <item>
      <title><![CDATA[${cdataSafe(post.title)}]]></title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${excerpt ? `<description><![CDATA[${cdataSafe(excerpt)}]]></description>` : ""}
      ${
        excerpt
          ? `<content:encoded><![CDATA[<p>${cdataSafe(
              excerpt,
            )}</p><p><a href="${xmlEscape(
              link,
            )}">Read full article</a></p>]]></content:encoded>`
          : ""
      }
      ${
        post.categories
          ?.map((c) => `<category>${xmlEscape(c.title)}</category>`)
          .join("") ?? ""
      }
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CodeFromScratch Blog</title>
    <link>${xmlEscape(`${SITE_URL}/blog`)}</link>
    <description>Web development tutorials, guides, and resources from CodeFromScratch.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${xmlEscape(`${SITE_URL}/blog/rss.xml`)}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${xmlEscape(`${SITE_URL}/brand/favicon-192.png`)}</url>
      <title>CodeFromScratch Blog</title>
      <link>${xmlEscape(`${SITE_URL}/blog`)}</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
