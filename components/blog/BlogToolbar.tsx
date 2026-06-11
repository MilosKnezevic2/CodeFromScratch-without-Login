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
    <div className="flex flex-col gap-3 border-y border-border py-4 sm:flex-row sm:items-center sm:gap-6">
      <form
        role="search"
        onSubmit={onSubmit}
        className="flex flex-1 items-center gap-3 border-b border-border/60 py-1 transition-colors focus-within:border-foreground"
      >
        <svg
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <label className="sr-only" htmlFor="blog-search">
          Search the journal
        </label>
        <input
          id="blog-search"
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Search the journal"
          className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"

        />
        {draft && (
          <button
            type="button"
            onClick={onClear}
            className="editorial-meta hover:text-foreground"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </form>

      {isOnBlogIndex && (
        <div role="group" aria-label="Sort" className="flex items-center gap-4">
          <span className="editorial-meta">Order</span>
          {(["newest", "oldest"] as const).map((s, i) => {
            const href = buildHref({ sort: s === "newest" ? null : s });
            const active = s === activeSort;
            return (
              <span key={s} className="flex items-center gap-3">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`-my-2.5 inline-flex min-h-11 items-center py-2.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s === "newest" ? "Newest" : "Oldest"}
                </Link>
                {i === 0 && (
                  <span aria-hidden className="text-muted-foreground">
                    ·
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
