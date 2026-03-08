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
      <h1 className="text-2xl font-bold text-foreground">Saved Posts</h1>

      {savedPosts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-8 text-center">
          <p className="text-muted">No saved posts yet.</p>
          <Link href="/blog" className="mt-2 inline-block text-sm text-accent hover:text-teal-300">
            Browse blog posts
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {savedPosts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/blog/${post.postSlug}`}
                className="card-glow block rounded-xl border border-border bg-surface/80 backdrop-blur-xl px-5 py-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5"
              >
                {post.postSlug}
                <span className="ml-2 text-xs text-muted-foreground">
                  Saved {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
