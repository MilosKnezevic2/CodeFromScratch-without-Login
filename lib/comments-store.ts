import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings/store";
import { displayName, type PublicComment } from "@/lib/comments";

/** Comments need both switches: comments on, and reader accounts open. */
export async function commentsOpen(): Promise<boolean> {
  const { features } = await getSettings();
  return features.commentsEnabled && features.registrationOpen;
}

/** The signed-in reader who may write, or null (signed out, deleted or banned). */
export async function currentReader(): Promise<{ id: string; name: string | null; email: string } | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, banned: true },
  });
  if (!user || user.banned) return null;
  return { id: user.id, name: user.name, email: user.email };
}

/** Approved comments for an article, oldest first, plus the viewer's own that wait for approval. */
export async function listComments(postSlug: string, viewerId: string | null): Promise<PublicComment[]> {
  const rows = await prisma.postComment.findMany({
    where: {
      postSlug,
      deletedAt: null,
      OR: [{ status: "APPROVED" }, ...(viewerId ? [{ status: "PENDING" as const, userId: viewerId }] : [])],
    },
    orderBy: { createdAt: "asc" },
    take: 300,
    select: { id: true, body: true, createdAt: true, status: true, userId: true, user: { select: { name: true, image: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    createdAt: r.createdAt.toISOString(),
    author: { name: displayName(r.user.name), image: r.user.image },
    mine: r.userId === viewerId,
    pending: r.status === "PENDING",
  }));
}
