import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { publishedSlugs } from "@/lib/analytics/store";
import { currentReader } from "@/lib/comments-store";
import { isSlug, MAX_SAVED } from "@/lib/reader/rules";

export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** The reader's saved articles (slug and folders) and their folders, for the save buttons. */
export async function GET() {
  const reader = await currentReader();
  if (!reader) return json({ signedIn: false, saved: [], folders: [] });
  const [saved, folders] = await Promise.all([
    prisma.savedPost.findMany({
      where: { userId: reader.id },
      select: { postSlug: true, collections: { select: { collectionId: true } } },
    }),
    prisma.collection.findMany({ where: { userId: reader.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return json({
    signedIn: true,
    saved: saved.map((s) => ({ slug: s.postSlug, folderIds: s.collections.map((c) => c.collectionId) })),
    folders,
  });
}

/**
 * Save, unsave, or put a saved article in or out of a folder.
 * Body: { slug, action: "save" | "unsave" | "folder", folderId?, inFolder? }.
 */
export async function POST(request: Request) {
  const reader = await currentReader();
  if (!reader) return json({ error: "Sign in to save articles." }, 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const slug = body?.slug;
  if (!isSlug(slug)) return json({ error: "Not found" }, 404);
  const action = body?.action;

  if (action === "unsave") {
    await prisma.savedPost.deleteMany({ where: { userId: reader.id, postSlug: slug } });
    return json({ saved: false });
  }

  const slugs = await publishedSlugs();
  if (slugs && !slugs.has(slug)) return json({ error: "Not found" }, 404);

  if (action === "save") {
    const count = await prisma.savedPost.count({ where: { userId: reader.id } });
    if (count >= MAX_SAVED) return json({ error: `You can keep up to ${MAX_SAVED} saved articles.` }, 409);
    await prisma.savedPost.upsert({
      where: { userId_postSlug: { userId: reader.id, postSlug: slug } },
      update: {},
      create: { userId: reader.id, postSlug: slug },
    });
    return json({ saved: true });
  }

  if (action === "folder") {
    const folderId = body?.folderId;
    if (typeof folderId !== "string") return json({ error: "Pick a folder." }, 400);
    const folder = await prisma.collection.findFirst({ where: { id: folderId, userId: reader.id }, select: { id: true } });
    if (!folder) return json({ error: "That folder does not exist." }, 404);
    // Putting an article in a folder saves it.
    const saved = await prisma.savedPost.upsert({
      where: { userId_postSlug: { userId: reader.id, postSlug: slug } },
      update: {},
      create: { userId: reader.id, postSlug: slug },
      select: { id: true },
    });
    if (body?.inFolder === false) {
      await prisma.savedPostCollection.deleteMany({ where: { savedPostId: saved.id, collectionId: folder.id } });
    } else {
      await prisma.savedPostCollection.upsert({
        where: { savedPostId_collectionId: { savedPostId: saved.id, collectionId: folder.id } },
        update: {},
        create: { savedPostId: saved.id, collectionId: folder.id },
      });
    }
    return json({ saved: true });
  }

  return json({ error: "Unknown action" }, 400);
}
