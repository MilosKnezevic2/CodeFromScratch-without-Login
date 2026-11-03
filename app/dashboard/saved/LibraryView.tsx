"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DeskFolder } from "@/lib/reader/desk";
import { FOLDER_COLORS, FOLDER_NAME_MAX, type FolderColor } from "@/lib/reader/rules";
import type { PostCard } from "@/lib/sanity/queries";
import { createFolder, deleteFolder, fileArticle, markRead, removeSaved, updateFolder } from "../actions";
import { Bar, Cover } from "../_ui/parts";

export interface LibraryItem {
  slug: string;
  post: PostCard | null;
  savedAt: string;
  folderIds: string[];
  state: "new" | "progress" | "read";
  percent: number;
}

type View = "all" | "new" | "progress" | "read";
type Sort = "saved" | "short" | "unread" | "topic";

const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "Not started" },
  { id: "progress", label: "In progress" },
  { id: "read", label: "Read" },
];

const LAYOUT_KEY = "cfs-library-layout";
/** A row of chips: one line that scrolls sideways on a phone, wrapping from tablet width up. */
const ROW = "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden";
const DRAG_TYPE = "text/x-cfs-article";

function readLayout(): "grid" | "list" {
  try {
    return localStorage.getItem(LAYOUT_KEY) === "list" ? "list" : "grid";
  } catch {
    // Storage blocked (private mode, site data off): the grid is the default.
    return "grid";
  }
}

const savedDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function LibraryView({
  items: initialItems,
  folders,
  initialFolder,
  focusNewFolder,
}: {
  items: LibraryItem[];
  folders: DeskFolder[];
  initialFolder: string | null;
  focusNewFolder: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [synced, setSynced] = useState(initialItems);
  // Fresh server data after an action replaces the optimistic copy.
  if (synced !== initialItems) {
    setSynced(initialItems);
    setItems(initialItems);
  }
  const [view, setView] = useState<View>("all");
  const [topic, setTopic] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("saved");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the remembered layout lives in this browser's storage, readable only after mount.
    setLayout(readLayout());
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(t);
  }, [toast]);

  const folder = folders.find((f) => f.id === initialFolder) ?? null;
  const inScope = folder ? items.filter((i) => i.folderIds.includes(folder.id)) : items;
  const counts = { all: inScope.length, new: 0, progress: 0, read: 0 } as Record<View, number>;
  for (const i of inScope) counts[i.state]++;

  const topics = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of inScope) if (i.post?.category) m.set(i.post.category, (m.get(i.post.category) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [inScope]);

  const q = query.trim().toLowerCase();
  const shown = inScope
    .filter((i) => view === "all" || i.state === view)
    .filter((i) => !topic || i.post?.category === topic)
    .filter((i) => !q || (i.post?.title ?? i.slug).toLowerCase().includes(q) || (i.post?.category ?? "").toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === "short") return (a.post?.readingTime ?? 99) - (b.post?.readingTime ?? 99);
      if (sort === "unread") return ["new", "progress", "read"].indexOf(a.state) - ["new", "progress", "read"].indexOf(b.state);
      if (sort === "topic") return (a.post?.category ?? "~").localeCompare(b.post?.category ?? "~");
      return b.savedAt.localeCompare(a.savedAt);
    });

  const minutesTotal = inScope.reduce((sum, i) => (i.state === "read" ? sum : sum + Math.round((i.post?.readingTime ?? 0) * (1 - i.percent / 100))), 0);

  function patch(slug: string, change: Partial<LibraryItem>) {
    setItems((list) => list.map((i) => (i.slug === slug ? { ...i, ...change } : i)));
  }

  function run(action: () => Promise<{ ok: boolean; error?: string }>, failed: () => void) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        failed();
        setToast({ text: result.error ?? "That did not work. Try again." });
      }
    });
  }

  function toggleFolder(item: LibraryItem, folderId: string) {
    const inFolder = !item.folderIds.includes(folderId);
    const before = item.folderIds;
    patch(item.slug, { folderIds: inFolder ? [...before, folderId] : before.filter((id) => id !== folderId) });
    run(() => fileArticle(item.slug, folderId, inFolder), () => patch(item.slug, { folderIds: before }));
  }

  function remove(item: LibraryItem) {
    setItems((list) => list.filter((i) => i.slug !== item.slug));
    run(() => removeSaved(item.slug), () => setItems((list) => [item, ...list]));
    setToast({
      text: `Removed “${item.post?.title ?? item.slug}”.`,
      undo: () => {
        setToast(null);
        startTransition(async () => {
          await fetch("/api/me/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: item.slug, action: "save" }) });
          await Promise.all(item.folderIds.map((id) => fileArticle(item.slug, id, true)));
          router.refresh();
        });
      },
    });
  }

  function read(item: LibraryItem) {
    const before = { state: item.state, percent: item.percent };
    patch(item.slug, { state: "read", percent: 100 });
    run(() => markRead(item.slug), () => patch(item.slug, before));
  }

  const title = folder ? folder.name : VIEWS.find((v) => v.id === view)?.label ?? "All saved";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-foreground">
            {folder && <span aria-hidden="true" className="h-4 w-4 shrink-0 rounded-[5px]" style={{ background: folder.hex }} />}
            <span className="truncate">{folder ? title : "Library"}</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {counts.all} {counts.all === 1 ? "article" : "articles"}
            {counts.new > 0 && ` · ${counts.new} not started`}
            {minutesTotal > 0 && ` · about ${minutesTotal >= 60 ? `${Math.floor(minutesTotal / 60)} h ${minutesTotal % 60} min` : `${minutesTotal} min`} of reading left`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-muted-foreground focus-within:border-accent/60">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="sr-only">Search your library</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library"
              maxLength={100}
              className="w-44 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:w-52 sm:text-sm"
            />
          </label>
          <label className="sr-only" htmlFor="library-sort">
            Sort
          </label>
          <select
            id="library-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground"
          >
            <option value="saved">Recently saved</option>
            <option value="short">Shortest first</option>
            <option value="unread">Not started first</option>
            <option value="topic">By topic</option>
          </select>
          <div className="flex overflow-hidden rounded-xl border border-border" role="group" aria-label="Layout">
            {(["grid", "list"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={layout === l}
                aria-label={l === "grid" ? "Show as cards" : "Show as a list"}
                onClick={() => {
                  setLayout(l);
                  try {
                    localStorage.setItem(LAYOUT_KEY, l);
                  } catch {
                    // Storage blocked: the choice lasts for this visit only.
                  }
                }}
                className={`flex h-11 w-11 items-center justify-center transition ${layout === l ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"}`}
              >
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {l === "grid" ? (
                    <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                  ) : (
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  )}
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Phones and tablets have no side menu, so the folders sit here. */}
      <nav aria-label="Folders" className={`${ROW} lg:hidden`}>
        <Link
          href="/dashboard/saved"
          aria-current={!folder ? "page" : undefined}
          className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm ${!folder ? "border-accent bg-accent/15 font-bold text-foreground" : "border-border text-muted"}`}
        >
          All saved <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
        </Link>
        {folders.map((f) => (
          <Link
            key={f.id}
            href={`/dashboard/saved?folder=${f.id}`}
            aria-current={folder?.id === f.id ? "page" : undefined}
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm ${folder?.id === f.id ? "border-accent bg-accent/15 font-bold text-foreground" : "border-border text-muted"}`}
          >
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: f.hex }} />
            {f.name} <span className="font-mono text-xs text-muted-foreground">{f.count}</span>
          </Link>
        ))}
      </nav>

      {folder ? <FolderBar folder={folder} onDone={(text) => setToast({ text })} /> : <NewFolder autoFocus={focusNewFolder} onDone={(text) => setToast({ text })} />}

      <div className={ROW} role="group" aria-label="Show">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={view === v.id}
            onClick={() => setView(v.id)}
            className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
              view === v.id ? "border-accent bg-accent/15 font-bold text-foreground" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {v.label}
            <span className="font-mono text-xs text-muted-foreground">{counts[v.id]}</span>
          </button>
        ))}
      </div>
      {topics.length > 1 && (
        <div className={ROW} role="group" aria-label="Topic">
          {topics.map(([name, n]) => (
            <button
              key={name}
              type="button"
              aria-pressed={topic === name}
              onClick={() => setTopic(topic === name ? null : name)}
              className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
                topic === name ? "border-accent bg-accent/15 text-foreground" : "border-border text-muted hover:text-foreground"
              }`}
            >
              {name}
              <span className="font-mono text-xs text-muted-foreground">{n}</span>
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-bold text-foreground">
            {items.length === 0 ? "Your library is empty" : q || topic || view !== "all" ? "Nothing matches" : "This folder is empty"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {items.length === 0
              ? "Press Save on any article and it lands here."
              : q || topic || view !== "all"
                ? "Try another filter or clear the search."
                : "Open an article’s menu (…) under All saved, or drag a card onto this folder in the side menu."}
          </p>
          {items.length === 0 && (
            <Link href="/blog" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground">
              Browse the articles
            </Link>
          )}
        </div>
      ) : (
        <ul className={layout === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "divide-y divide-border rounded-2xl border border-border bg-surface"}>
          {shown.map((item) => (
            <Card
              key={item.slug}
              item={item}
              folders={folders}
              layout={layout}
              onToggleFolder={(id) => toggleFolder(item, id)}
              onRemove={() => remove(item)}
              onRead={() => read(item)}
            />
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Tip: on a computer, drag a card onto a folder in the side menu. One article can sit in several folders.
      </p>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-6">
        {toast && (
          <div className="pointer-events-auto flex items-center gap-4 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-foreground shadow-xl">
            <span>{toast.text}</span>
            {toast.undo && (
              <button type="button" onClick={toast.undo} className="min-h-9 font-bold text-accent">
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({
  item,
  folders,
  layout,
  onToggleFolder,
  onRemove,
  onRead,
}: {
  item: LibraryItem;
  folders: DeskFolder[];
  layout: "grid" | "list";
  onToggleFolder: (folderId: string) => void;
  onRemove: () => void;
  onRead: () => void;
}) {
  const post = item.post;
  const title = post?.title ?? `${item.slug} (no longer published)`;
  const inFolders = folders.filter((f) => item.folderIds.includes(f.id));
  const state =
    item.state === "read" ? (
      <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-[11px] text-accent">Read</span>
    ) : item.state === "progress" ? (
      <span className="rounded-md bg-amber-400/15 px-2 py-0.5 font-mono text-[11px] text-amber-600 dark:text-amber-300">{item.percent}% read</span>
    ) : (
      <span className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">Not started</span>
    );

  const dragProps = {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData(DRAG_TYPE, item.slug);
      e.dataTransfer.effectAllowed = "copy";
    },
  };

  const tags = (
    <>
      {inFolders.map((f) => (
        <span key={f.id} className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs text-muted">
          <span aria-hidden="true" className="h-2 w-2 rounded-[2px]" style={{ background: f.hex }} />
          {f.name}
        </span>
      ))}
    </>
  );

  const menu = <ArticleMenu item={item} folders={folders} onToggleFolder={onToggleFolder} onRemove={onRemove} onRead={onRead} />;

  if (layout === "list") {
    return (
      <li {...dragProps} className="flex items-center gap-4 p-4">
        {post && <Cover post={post} sizes="6rem" className="hidden aspect-[1200/630] w-28 shrink-0 rounded-lg sm:flex" />}
        <div className="min-w-0 flex-1">
          {post ? (
            <Link href={`/blog/${item.slug}`} className="font-bold leading-snug text-foreground hover:text-accent">
              {title}
            </Link>
          ) : (
            <span className="font-bold text-muted">{title}</span>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
            {state}
            {post?.category && <span>{post.category}</span>}
            {post?.readingTime && <span>· {post.readingTime} min</span>}
            <span>· saved {savedDate(item.savedAt)}</span>
            {tags}
          </div>
        </div>
        {menu}
      </li>
    );
  }

  return (
    <li {...dragProps} className="relative flex flex-col rounded-2xl border border-border bg-surface transition hover:border-accent/40">
      {post ? (
        <Link href={`/blog/${item.slug}`} className="group block" tabIndex={-1} aria-hidden="true">
          <Cover post={post} sizes="(min-width: 1280px) 20rem, (min-width: 640px) 45vw, 100vw" className="aspect-[1200/630] w-full rounded-t-2xl border-b border-border" />
        </Link>
      ) : (
        <div className="aspect-[1200/630] w-full rounded-t-2xl border-b border-border bg-surface-2" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {post ? (
          <Link href={`/blog/${item.slug}`} className="font-bold leading-snug text-foreground line-clamp-2 hover:text-accent">
            {title}
          </Link>
        ) : (
          <span className="font-bold text-muted">{title}</span>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {post?.readingTime && <span>{post.readingTime} min</span>}
          <span>· saved {savedDate(item.savedAt)}</span>
          <span className="ml-auto">{state}</span>
        </div>
        <Bar percent={item.percent} label={`${item.percent}% read`} />
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          {tags}
          <span className="ml-auto">{menu}</span>
        </div>
      </div>
    </li>
  );
}

function ArticleMenu({
  item,
  folders,
  onToggleFolder,
  onRemove,
  onRead,
}: {
  item: LibraryItem;
  folders: DeskFolder[];
  onToggleFolder: (folderId: string) => void;
  onRemove: () => void;
  onRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${item.post?.title ?? item.slug}`}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${open ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"}`}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div id={menuId} className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl border border-border bg-surface-2 p-1.5 text-sm shadow-2xl sm:bottom-auto sm:top-full sm:mb-0 sm:mt-2">
          <p className="px-2.5 pb-1 pt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">In folders</p>
          {folders.length === 0 && <p className="px-2.5 py-2 text-muted">No folders yet. Create one above the list.</p>}
          {folders.map((f) => {
            const on = item.folderIds.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => onToggleFolder(f.id)}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-foreground hover:bg-surface"
              >
                <span aria-hidden="true" className="w-4 text-accent">
                  {on ? "✓" : ""}
                </span>
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: f.hex }} />
                <span className="truncate">{f.name}</span>
              </button>
            );
          })}
          <div className="my-1.5 h-px bg-border" />
          {item.state !== "read" && (
            <button
              type="button"
              onClick={() => {
                onRead();
                setOpen(false);
              }}
              className="flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-foreground hover:bg-surface"
            >
              Mark as read
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="flex min-h-10 w-full items-center rounded-lg px-2.5 text-left text-red-600 hover:bg-surface dark:text-red-300"
          >
            Remove from library
          </button>
        </div>
      )}
    </div>
  );
}

function NewFolder({ autoFocus, onDone }: { autoFocus: boolean; onDone: (text: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createFolder(name);
          if (!result.ok) return setError(result.error);
          setError(null);
          setName("");
          onDone(`Folder “${result.folder.name}” created. Add articles from their menu (…).`);
          router.refresh();
        });
      }}
      className="flex flex-wrap items-start gap-2"
    >
      <label htmlFor="new-folder" className="sr-only">
        New folder name
      </label>
      <input
        id="new-folder"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={FOLDER_NAME_MAX}
        // Only when the reader came here for it, from "+ New folder" in the side menu.
        autoFocus={autoFocus}
        placeholder="New folder, e.g. To read this weekend"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "new-folder-error" : undefined}
        className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-base text-foreground outline-none focus:border-accent/60 sm:max-w-sm sm:text-sm"
      />
      <button type="submit" disabled={pending} className="h-11 rounded-xl border border-accent px-4 text-sm font-bold text-accent transition hover:bg-accent/10 disabled:opacity-50">
        Create folder
      </button>
      {error && (
        <p id="new-folder-error" role="alert" className="w-full text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}

function FolderBar({ folder, onDone }: { folder: DeskFolder; onDone: (text: string) => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = (change: { name?: string; color?: FolderColor }) =>
    startTransition(async () => {
      const result = await updateFolder(folder.id, change);
      if (!result.ok) return setError(result.error);
      setError(null);
      setEditing(false);
    });

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-border bg-surface p-3 sm:px-4">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Folder colour">
        {(Object.entries(FOLDER_COLORS) as [FolderColor, string][]).map(([key, hex]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={folder.color === key}
            aria-label={key}
            onClick={() => save({ color: key })}
            className={`flex h-9 w-9 items-center justify-center rounded-full ${folder.color === key ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface" : ""}`}
          >
            <span className="h-5 w-5 rounded-full" style={{ background: hex }} />
          </button>
        ))}
      </div>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save({ name });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor="folder-name" className="sr-only">
            Folder name
          </label>
          <input
            id="folder-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={FOLDER_NAME_MAX}
            required
            className="h-10 rounded-lg border border-border bg-background px-3 text-base text-foreground sm:text-sm"
          />
          <button type="submit" disabled={pending} className="h-10 rounded-lg bg-accent px-3 text-sm font-bold text-accent-foreground">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="h-10 px-2 text-sm text-muted">
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setEditing(true)} className="min-h-10 text-sm text-muted hover:text-foreground">
          Rename
        </button>
      )}
      {confirming ? (
        <span className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-foreground">Delete “{folder.name}”? The articles stay in your library.</span>
          <button
            type="button"
            onClick={() =>
              startTransition(async () => {
                await deleteFolder(folder.id);
                onDone(`Folder “${folder.name}” deleted.`);
                router.push("/dashboard/saved");
              })
            }
            className="h-10 rounded-lg border border-red-400 px-3 font-bold text-red-600 dark:text-red-300"
          >
            Delete
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="h-10 px-2 text-muted">
            Keep it
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="min-h-10 text-sm text-muted hover:text-red-500">
          Delete folder
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
