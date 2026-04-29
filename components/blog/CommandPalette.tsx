"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InstantSearchPost } from "@/lib/sanity/queries";

const RECENT_KEY = "blog-recent-q";
const RECENT_LIMIT = 5;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function pushRecent(value: string) {
  if (typeof window === "undefined") return;
  const trimmed = value.trim();
  if (trimmed.length < 2) return;
  const current = loadRecent().filter(
    (v) => v.toLowerCase() !== trimmed.toLowerCase(),
  );
  current.unshift(trimmed);
  window.localStorage.setItem(
    RECENT_KEY,
    JSON.stringify(current.slice(0, RECENT_LIMIT)),
  );
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<InstantSearchPost[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Open with ⌘K / Ctrl+K, close with Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isOpenShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isOpenShortcut) {
        e.preventDefault();
        setOpen((p) => !p);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Focus input + load recent searches on open
  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    setHighlight(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  // Live fetch with abort + 150ms debounce
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctl = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ctl;
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/blog/search-instant?q=${encodeURIComponent(query.trim())}`,
          { signal: ctl.signal },
        );
        if (!res.ok) {
          setResults([]);
          setLoading(false);
          return;
        }
        const body = (await res.json()) as { posts: InstantSearchPost[] };
        setResults(body.posts ?? []);
      } catch {
        // aborted or network error — no-op
      } finally {
        if (!ctl.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [query, open]);

  function navigate(url: string, savedQuery?: string) {
    if (savedQuery) pushRecent(savedQuery);
    setOpen(false);
    setQuery("");
    router.push(url);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) {
      if (e.key === "Enter" && query.trim().length >= 2) {
        navigate(`/blog?q=${encodeURIComponent(query.trim())}`, query);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[highlight];
      if (target) {
        navigate(`/blog/${target.slug.current}`, query);
      }
    }
  }

  if (!open) {
    return (
      <div className="hidden">
        {/* Trigger lives in the toolbar; this presence ensures the
            keyboard listener mounts on every page render. */}
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search articles"
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={() => setOpen(false)}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-[1] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <svg
            aria-hidden
            className="h-5 w-5 text-muted-foreground"
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
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search articles, topics, authors…"
            className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Searching…
            </p>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No matches. Press <kbd className="font-mono">↵</kbd> to search
              the full catalog.
            </p>
          )}

          {results.length > 0 && (
            <ul role="listbox" aria-label="Search results" className="space-y-1">
              {results.map((post, i) => (
                <li key={post._id}>
                  <Link
                    href={`/blog/${post.slug.current}`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => navigate(`/blog/${post.slug.current}`, query)}
                    className={`block rounded-lg px-3 py-2.5 text-sm transition ${
                      i === highlight
                        ? "bg-accent/15 text-foreground"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    }`}
                    aria-selected={i === highlight}
                    role="option"
                  >
                    <p className="font-bold text-foreground line-clamp-1">
                      {post.title}
                    </p>
                    {post.excerpt && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {post.excerpt}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                      {post.category && (
                        <span className="font-bold uppercase tracking-wider text-accent">
                          {post.category}
                        </span>
                      )}
                      {post.readingTime && (
                        <span>· {post.readingTime} min read</span>
                      )}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {query.length < 2 && recent.length > 0 && (
            <div className="px-1 py-2">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Recent searches
              </p>
              <ul className="mt-1 space-y-1">
                {recent.map((q) => (
                  <li key={q}>
                    <button
                      type="button"
                      onClick={() => setQuery(q)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                    >
                      <span aria-hidden>↺</span>
                      <span>{q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 bg-background/40 px-4 py-2 text-[10px] text-muted-foreground">
          <span>
            <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd>{" "}
            navigate · <kbd className="font-mono">↵</kbd> open ·{" "}
            <kbd className="font-mono">esc</kbd> close
          </span>
          <span>
            <kbd className="font-mono">⌘K</kbd> anywhere
          </span>
        </div>
      </div>
    </div>
  );
}
