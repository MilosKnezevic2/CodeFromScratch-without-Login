import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type PageProps = { params: Promise<{ id: string }> };

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: { savedPosts: { include: { savedPost: true } } },
  });

  if (!collection || collection.userId !== user.id) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/collections" className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:border-accent/30 hover:text-accent">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
          <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{collection.name}</h1>
          <p className="text-xs text-muted-foreground">{collection.savedPosts.length} {collection.savedPosts.length === 1 ? "post" : "posts"}</p>
        </div>
      </div>

      {collection.savedPosts.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-sm font-medium text-foreground">This collection is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">Add posts to this collection from any article page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {collection.savedPosts.map(({ savedPost }, i) => (
            <Link
              key={savedPost.id}
              href={`/blog/${savedPost.postSlug}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/20"
            >
              <span className="gradient-number hidden text-2xl font-black sm:block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-sm font-semibold text-foreground transition group-hover:text-accent truncate capitalize">
                {savedPost.postSlug.replace(/-/g, " ")}
              </p>
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
