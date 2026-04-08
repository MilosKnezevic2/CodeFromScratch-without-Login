import { client } from "@/lib/sanity/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function GET() {
  const posts = await client.fetch<
    { title: string; slug: { current: string }; excerpt?: string; publishedAt: string; categories?: { title: string }[] }[]
  >(
    `*[_type == "post" && status == "published"] | order(publishedAt desc) [0...100] {
      title, slug, excerpt, publishedAt, categories[]->{ title }
    }`
  );

  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const items = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blog/${post.slug.current}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.slug.current}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.excerpt ? `<description><![CDATA[${post.excerpt}]]></description>` : ""}
      ${post.excerpt ? `<content:encoded><![CDATA[<p>${post.excerpt}</p><p><a href="${SITE_URL}/blog/${post.slug.current}">Read full article</a></p>]]></content:encoded>` : ""}
      ${post.categories?.map((c) => `<category>${c.title}</category>`).join("") ?? ""}
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>CodeFromScratch Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Web development tutorials, guides, and resources from CodeFromScratch.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/logo.svg</url>
      <title>CodeFromScratch Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
