"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState } from "react";

type Sort = "newest" | "oldest";

export default function BlogToolbar({
  initialSearch,
  activeSort,
  preserveQuery,
  searchActionPath = "/blog",
}: {
  initialSearch: string;
  activeSort: Sort;
  preserveQuery: Record<string, string>;
  searchActionPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname() ?? "/blog";
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState(initialSearch);

  function buildHref(overrides: Partial<Record<string, string | null>>): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(preserveQuery)) {
      if (v) params.set(k, v);
    }
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") params.delete(k);
      else if (v !== undefined) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${searchActionPath}?${qs}` : searchActionPath;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = buildHref({ q: draft || null, page: null });
    startTransition(() => router.push(target));
  }

  function onClear() {
    setDraft("");
    const target = buildHref({ q: null, page: null });
    startTransition(() => router.push(target));
  }

  const isOnBlogIndex = pathname === "/blog";

  return (
    <div className="glow-border flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface/70 p-3 backdrop-blur-sm sm:flex-row sm:items-center">
      <form
        role="search"
        onSubmit={onSubmit}
        className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 transition focus-within:border-accent/60"
      >
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <label className="sr-only" htmlFor="blog-search">
          Search blog
        </label>
        <input
          id="blog-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search articles, topics, authors…"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {draft && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
        <kbd className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground sm:inline">
          ↵
        </kbd>
      </form>

      {isOnBlogIndex && (
        <div
          role="group"
          aria-label="Sort"
          className="flex items-center gap-1 rounded-xl border border-border bg-background p-1"
        >
          {(["newest", "oldest"] as const).map((s) => {
            const href = buildHref({ sort: s === "newest" ? null : s });
            const active = s === activeSort;
            return (
              <Link
                key={s}
                href={href}
                aria-pressed={active}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "newest" ? "Newest" : "Oldest"}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
