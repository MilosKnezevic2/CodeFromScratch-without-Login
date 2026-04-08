import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import Link from "next/link";

interface SanityPostSummary {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  categories?: { title: string }[];
}

export default async function AdminContentPage() {
  const [posts, postViews, reactionCounts, savedCounts] = await Promise.all([
    client.fetch<SanityPostSummary[]>(
      `*[_type == "post" && status == "published"] | order(publishedAt desc) {
        _id, title, slug, publishedAt, categories[]->{ title }
      }`
    ).catch(() => [] as SanityPostSummary[]),
    prisma.postView.findMany(),
    prisma.postReaction.groupBy({ by: ["postSlug"], _count: { postSlug: true } }),
    prisma.savedPost.groupBy({ by: ["postSlug"], _count: { postSlug: true } }),
  ]);

  const viewMap = new Map(postViews.map((v) => [v.postSlug, v.count]));
  const reactionMap = new Map(reactionCounts.map((r) => [r.postSlug, r._count.postSlug]));
  const saveMap = new Map(savedCounts.map((s) => [s.postSlug, s._count.postSlug]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Content</h1>
          <p className="mt-1 text-sm text-muted-foreground">{posts.length} published posts</p>
        </div>
        <Link href="/portal-cfs-admin/studio" className="cta-glow rounded-lg px-4 py-2 text-sm font-semibold">
          Open CMS Studio
        </Link>
      </div>

      <div className="glow-border overflow-hidden rounded-xl bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Post</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold text-right">Views</th>
                <th className="px-5 py-3 font-semibold text-right">Reactions</th>
                <th className="px-5 py-3 font-semibold text-right">Saves</th>
                <th className="px-5 py-3 font-semibold">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((post) => {
                const slug = post.slug.current;
                return (
                  <tr key={post._id} className="transition hover:bg-surface-2/50">
                    <td className="max-w-[300px] truncate px-5 py-3.5 font-medium text-foreground">
                      <Link href={`/blog/${slug}`} className="hover:text-accent transition" target="_blank">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{post.categories?.[0]?.title || "—"}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">{(viewMap.get(slug) || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{reactionMap.get(slug) || 0}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{saveMap.get(slug) || 0}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No published posts yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
