import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CollectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      savedPosts: {
        include: { savedPost: true },
      },
    },
  });

  if (!collection || collection.userId !== user.id) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/collections" className="text-sm text-muted-foreground hover:text-accent transition">
          &larr; Collections
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{collection.name}</h1>
      </div>

      {collection.savedPosts.length === 0 ? (
        <p className="text-muted">No posts in this collection yet.</p>
      ) : (
        <ul className="space-y-3">
          {collection.savedPosts.map(({ savedPost }) => (
            <li key={savedPost.id}>
              <Link
                href={`/blog/${savedPost.postSlug}`}
                className="card-glow block rounded-xl border border-border bg-surface/80 backdrop-blur-xl px-5 py-4 text-sm font-medium text-foreground transition hover:-translate-y-0.5"
              >
                {savedPost.postSlug}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
