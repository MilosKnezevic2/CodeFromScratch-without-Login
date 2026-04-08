import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getPostsBySlugList } from "@/lib/sanity/queries";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

export default async function ReadingHistoryPage() {
  const user = await requireAuth();

  const history = await prisma.readingHistory.findMany({
    where: { userId: user.id },
    orderBy: { readAt: "desc" },
    take: 50,
  });

  const slugs = history.map((h) => h.postSlug);
  const posts = slugs.length > 0 ? await getPostsBySlugList(slugs) : [];
  const postMap = new Map(posts.map((p) => [p.slug.current, p]));

  const completed = history.filter((h) => h.completedAt || h.scrollPercent >= 90);
  const inProgress = history.filter((h) => !h.completedAt && h.scrollPercent < 90);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reading History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {history.length} article{history.length !== 1 ? "s" : ""} tracked
        </p>
      </div>

      {history.length === 0 && (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-muted-foreground">No reading history yet.</p>
          <Link href="/blog" className="mt-4 inline-block text-sm font-medium text-accent hover:text-accent-2 transition">
            Start reading &rarr;
          </Link>
        </div>
      )}

      {inProgress.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            In Progress ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.map((item) => {
              const post = postMap.get(item.postSlug);
              if (!post) return null;
              return (
                <Link
                  key={item.id}
                  href={`/blog/${item.postSlug}`}
                  className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/20"
                >
                  {post.featuredImage?.asset && (
                    <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                      <Image
                        src={urlFor(post.featuredImage).width(96).height(64).quality(75).url()}
                        alt={post.title}
                        width={96}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition">
                      {post.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {post.readingTime ? `${post.readingTime} min` : ""} · {new Date(item.readAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2"
                          style={{ width: `${item.scrollPercent}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{item.scrollPercent}%</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Completed ({completed.length})
          </h2>
          <div className="space-y-3">
            {completed.map((item) => {
              const post = postMap.get(item.postSlug);
              if (!post) return null;
              return (
                <Link
                  key={item.id}
                  href={`/blog/${item.postSlug}`}
                  className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/20"
                >
                  {post.featuredImage?.asset && (
                    <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:block">
                      <Image
                        src={urlFor(post.featuredImage).width(96).height(64).quality(75).url()}
                        alt={post.title}
                        width={96}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-accent transition">
                        {post.title}
                      </p>
                      <span className="shrink-0 text-xs text-green-400">✓</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {post.readingTime ? `${post.readingTime} min` : ""} · Read on {new Date(item.readAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
