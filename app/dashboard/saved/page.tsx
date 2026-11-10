import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { deskFolders } from "@/lib/reader/desk";
import { READ_AT_PERCENT } from "@/lib/reader/rules";
import { requireReader } from "@/lib/reader/session";
import { getPostCards } from "@/lib/sanity/queries";
import LibraryView, { type LibraryItem } from "./LibraryView";

export const metadata: Metadata = {
  title: "Your library",
  robots: { index: false, follow: false },
};

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ folder?: string; new?: string }> }) {
  const reader = await requireReader("/dashboard/saved");
  const params = await searchParams;
  const [folders, saved] = await Promise.all([
    deskFolders(reader.id),
    prisma.savedPost.findMany({
      where: { userId: reader.id },
      orderBy: { createdAt: "desc" },
      select: { postSlug: true, createdAt: true, collections: { select: { collectionId: true } } },
    }),
  ]);
  const slugs = saved.map((s) => s.postSlug);
  const [cards, history] = await Promise.all([
    getPostCards(slugs).catch((error: unknown) => {
      console.error("Library could not load article cards:", error);
      return new Map<string, never>();
    }),
    prisma.readingHistory.findMany({
      where: { userId: reader.id, postSlug: { in: slugs } },
      select: { postSlug: true, scrollPercent: true, lastPercent: true, completedAt: true },
    }),
  ]);
  const progress = new Map(history.map((h) => [h.postSlug, h]));

  const items: LibraryItem[] = saved.map((s) => {
    const h = progress.get(s.postSlug);
    const read = Boolean(h?.completedAt) || (h?.scrollPercent ?? 0) >= READ_AT_PERCENT;
    return {
      slug: s.postSlug,
      post: cards.get(s.postSlug) ?? null,
      savedAt: s.createdAt.toISOString(),
      folderIds: s.collections.map((c) => c.collectionId),
      state: read ? "read" : h ? "progress" : "new",
      percent: read ? 100 : (h?.lastPercent ?? 0),
    };
  });

  return (
    <LibraryView
      items={items}
      folders={folders}
      initialFolder={folders.some((f) => f.id === params.folder) ? (params.folder ?? null) : null}
      focusNewFolder={params.new === "folder"}
    />
  );
}
