import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SavedPostsPage() {
  const user = await requireAuth();

  const savedPosts = await prisma.savedPost.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Saved Posts</h1>
            <p className="text-xs text-muted-foreground">{savedPosts.length} {savedPosts.length === 1 ? "post" : "posts"} saved</p>
          </div>
        </div>
        <Link href="/blog" className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-accent/30 hover:text-accent">
          Browse Posts
        </Link>
      </div>

      {savedPosts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
            <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No saved posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Save articles while reading to find them here later.</p>
          <Link href="/blog" className="gradient-btn mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
            Browse Articles
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {savedPosts.map((post, i) => (
            <Link
              key={post.id}
              href={`/blog/${post.postSlug}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/20"
            >
              <span className="gradient-number hidden text-2xl font-black sm:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground transition group-hover:text-accent truncate capitalize">
                  {post.postSlug.replace(/-/g, " ")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Saved {new Date(post.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border transition group-hover:border-accent/30 group-hover:bg-accent/5">
                <svg className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
