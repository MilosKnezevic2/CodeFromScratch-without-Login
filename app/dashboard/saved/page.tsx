import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireReader } from "@/lib/reader/session";
import { getPostCards } from "@/lib/sanity/queries";
import { deleteFolderAction, setFolderAction, unsaveAction } from "../actions";
import { NewFolderForm, RenameFolderForm } from "./FolderForms";

export const metadata: Metadata = {
  title: "Saved articles",
  robots: { index: false, follow: false },
};

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const reader = await requireReader("/dashboard/saved");
  const { folder: folderParam } = await searchParams;

  const [folders, saved] = await Promise.all([
    prisma.collection.findMany({
      where: { userId: reader.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { savedPosts: true } } },
    }),
    prisma.savedPost.findMany({
      where: { userId: reader.id },
      orderBy: { createdAt: "desc" },
      select: { postSlug: true, createdAt: true, collections: { select: { collectionId: true } } },
    }),
  ]);
  const active = folders.find((f) => f.id === folderParam) ?? null;
  const shown = active ? saved.filter((s) => s.collections.some((c) => c.collectionId === active.id)) : saved;
  const unfiled = saved.filter((s) => s.collections.length === 0).length;
  const cards = await getPostCards(shown.map((s) => s.postSlug));

  const chip = (href: string, label: string, count: number, on: boolean) => (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm transition ${
        on ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted hover:text-foreground"
      }`}
    >
      {label}
      <span className="text-xs text-muted-foreground">{count}</span>
    </Link>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">Saved</h1>
        <p className="mt-2 text-sm text-muted">
          {saved.length} saved {saved.length === 1 ? "article" : "articles"}
          {unfiled > 0 && `, ${unfiled} not in a folder`}. An article can sit in several folders.
        </p>
      </div>

      <section aria-label="Folders" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {chip("/dashboard/saved", "All", saved.length, !active)}
          {folders.map((f) => chip(`/dashboard/saved?folder=${f.id}`, f.name, f._count.savedPosts, active?.id === f.id))}
        </div>
        <NewFolderForm />
        {active && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-3 text-sm">
            <span className="font-semibold text-foreground">{active.name}</span>
            <RenameFolderForm folderId={active.id} name={active.name} />
            <form action={deleteFolderAction}>
              <input type="hidden" name="folderId" value={active.id} />
              <button type="submit" className="min-h-9 text-xs text-muted-foreground hover:text-red-400">
                Delete folder (articles stay saved)
              </button>
            </form>
          </div>
        )}
      </section>

      {shown.length === 0 ? (
        <p className="text-sm text-muted">
          {active ? "Nothing in this folder yet. Add articles from the list under All." : "Nothing saved yet. Use the Save button on any article."}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((s) => {
            const card = cards.get(s.postSlug);
            const inFolders = new Set(s.collections.map((c) => c.collectionId));
            return (
              <li key={s.postSlug} className="rounded-xl border border-border bg-surface p-4">
                {card ? (
                  <Link href={`/blog/${s.postSlug}`} className="font-semibold text-foreground hover:text-accent">
                    {card.title}
                  </Link>
                ) : (
                  <span className="font-semibold text-muted-foreground">{s.postSlug} (no longer published)</span>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {card?.category ? `${card.category} · ` : ""}
                  {card?.readingTime ? `${card.readingTime} min · ` : ""}saved{" "}
                  {s.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {folders.map((f) => {
                    const on = inFolders.has(f.id);
                    return (
                      <form key={f.id} action={setFolderAction}>
                        <input type="hidden" name="slug" value={s.postSlug} />
                        <input type="hidden" name="folderId" value={f.id} />
                        <input type="hidden" name="inFolder" value={on ? "false" : "true"} />
                        <button
                          type="submit"
                          aria-pressed={on}
                          className={`min-h-8 rounded-full border px-3 text-xs transition ${
                            on ? "border-accent/60 bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {on ? "✓ " : "+ "}
                          {f.name}
                        </button>
                      </form>
                    );
                  })}
                  <form action={unsaveAction} className="ml-auto">
                    <input type="hidden" name="slug" value={s.postSlug} />
                    <button type="submit" className="min-h-8 text-xs text-muted-foreground hover:text-red-400">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
