"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { RefObject } from "react";

export interface SearchResult {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt?: string;
  categories?: { title: string }[];
}

/**
 * The search dialog itself. It carries the animation library, so the navbar
 * loads this file only once someone opens the search; the button that opens
 * it lives in SearchModal and weighs nothing.
 */
export default function SearchPanel({
  open,
  query,
  results,
  loading,
  inputRef,
  onInput,
  onClose,
}: {
  open: boolean;
  query: string;
  results: SearchResult[];
  loading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onInput: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Search articles"
            className="fixed left-1/2 top-[15%] z-[91] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <svg className="h-5 w-5 shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => onInput(e.target.value)}
                placeholder="Search articles..."
                aria-label="Search articles"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none"
              />
              <kbd className="rounded border border-border/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto p-2" aria-live="polite">
              {loading && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Searching...</p>
              )}

              {!loading && query.length >= 2 && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </p>
              )}

              {!loading && results.length > 0 && (
                <ul>
                  {results.map((r) => (
                    <li key={r._id}>
                      <Link
                        href={`/blog/${r.slug.current}`}
                        onClick={onClose}
                        className="block rounded-lg px-3 py-3 transition hover:bg-surface-2"
                      >
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        {r.excerpt && (
                          <p className="mt-0.5 text-xs text-muted line-clamp-1">{r.excerpt}</p>
                        )}
                        {r.categories && r.categories.length > 0 && (
                          <div className="mt-1.5 flex gap-1.5">
                            {r.categories.map((c) => (
                              <span key={c.title} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                                {c.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {!loading && query.length < 2 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Type to search articles...
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
