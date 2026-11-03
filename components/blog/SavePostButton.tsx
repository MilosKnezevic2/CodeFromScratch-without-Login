"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useId, useRef, useState } from "react";
import { useSavedPosts } from "./SavedPostsProvider";

async function call(url: string, body: unknown): Promise<Response> {
  return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.6 3.32c1.1.13 1.9 1.07 1.9 2.18V21L12 17.25 4.5 21V5.5c0-1.11.8-2.05 1.9-2.18a48.5 48.5 0 0 1 11.2 0z" />
    </svg>
  );
}

/**
 * Saves an article for a signed-in reader and files it in their folders.
 * Signed-out readers see nothing, except on the article itself (`showSignedOut`),
 * where it invites them to log in. `iconOnly` is the compact form for cards.
 */
export default function SavePostButton({
  postSlug,
  iconOnly = false,
  showSignedOut = false,
}: {
  postSlug: string;
  iconOnly?: boolean;
  showSignedOut?: boolean;
}) {
  const { status } = useSession();
  const { saved, folders, ensureLoaded, update, refetch } = useSavedPosts();
  const [open, setOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (status === "authenticated") ensureLoaded();
  }, [status, ensureLoaded]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (status !== "authenticated") {
    if (!showSignedOut || status === "loading") return null;
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(`/blog/${postSlug}`)}`}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted transition hover:border-accent/40 hover:text-foreground"
      >
        <BookmarkIcon filled={false} />
        Save
      </Link>
    );
  }

  const entry = saved.find((s) => s.slug === postSlug);
  const isSaved = Boolean(entry);

  async function toggleSaved() {
    setError(null);
    const next = !isSaved;
    update((prev) => ({
      ...prev,
      saved: next ? [...prev.saved, { slug: postSlug, folderIds: [] }] : prev.saved.filter((s) => s.slug !== postSlug),
    }));
    const res = await call("/api/me/saved", { slug: postSlug, action: next ? "save" : "unsave" });
    if (!res.ok) {
      setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "That did not work. Try again.");
      await refetch();
    } else if (next) {
      setOpen(true);
    }
  }

  async function toggleFolder(folderId: string, inFolder: boolean) {
    update((prev) => ({
      ...prev,
      saved: [
        ...prev.saved.filter((s) => s.slug !== postSlug),
        {
          slug: postSlug,
          folderIds: inFolder
            ? [...(entry?.folderIds ?? []), folderId]
            : (entry?.folderIds ?? []).filter((id) => id !== folderId),
        },
      ],
    }));
    const res = await call("/api/me/saved", { slug: postSlug, action: "folder", folderId, inFolder });
    if (!res.ok) await refetch();
  }

  async function createFolder(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const res = await call("/api/me/folders", { name: newFolder });
    const data = (await res.json().catch(() => ({}))) as { id?: string; name?: string; error?: string };
    if (!res.ok || !data.id) {
      setError(data.error ?? "The folder could not be created.");
      return;
    }
    setNewFolder("");
    update((prev) => ({ ...prev, folders: [...prev.folders.filter((f) => f.id !== data.id), { id: data.id!, name: data.name! }] }));
    await toggleFolder(data.id, true);
  }

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isSaved) setOpen((o) => !o);
          else void toggleSaved();
        }}
        aria-pressed={isSaved}
        aria-expanded={isSaved ? open : undefined}
        aria-controls={isSaved ? popoverId : undefined}
        aria-label={iconOnly ? (isSaved ? "Saved: choose folders" : "Save article") : undefined}
        className={
          iconOnly
            ? `flex h-11 w-11 items-center justify-center rounded-full transition ${isSaved ? "text-accent" : "text-muted-foreground hover:text-foreground"}`
            : `inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm transition ${
                isSaved ? "border-accent/50 text-accent" : "border-border text-muted hover:border-accent/40 hover:text-foreground"
              }`
        }
      >
        <BookmarkIcon filled={isSaved} />
        {!iconOnly && (isSaved ? "Saved" : "Save")}
      </button>

      {open && isSaved && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Folders for this article"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-surface p-3 text-left shadow-xl"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">Saved. Put it in a folder:</p>
          {folders.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {folders.map((f) => {
                const checked = entry?.folderIds.includes(f.id) ?? false;
                return (
                  <label key={f.id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-foreground hover:bg-surface-2">
                    <input type="checkbox" checked={checked} onChange={() => void toggleFolder(f.id, !checked)} className="h-4 w-4 accent-[var(--color-accent)]" />
                    <span className="truncate">{f.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          <form onSubmit={createFolder} className="mt-2 flex gap-2">
            <label htmlFor={`${popoverId}-new`} className="sr-only">
              New folder name
            </label>
            <input
              id={`${popoverId}-new`}
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              maxLength={60}
              placeholder="New folder"
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-2 text-sm text-foreground outline-none focus:border-accent/60"
            />
            <button type="submit" disabled={!newFolder.trim()} className="h-9 rounded-lg bg-accent px-3 text-xs font-bold text-accent-foreground disabled:opacity-50">
              Add
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-2 text-xs text-red-400">
              {error}
            </p>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
            <Link href="/dashboard/saved" className="text-accent hover:underline">
              Open your library
            </Link>
            <button type="button" onClick={() => { setOpen(false); void toggleSaved(); }} className="min-h-8 text-muted-foreground hover:text-red-400">
              Remove from saved
            </button>
          </div>
        </div>
      )}
      {error && !open && (
        <p role="alert" className="absolute right-0 top-full mt-1 w-56 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
