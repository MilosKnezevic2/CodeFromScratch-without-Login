"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CategoryWithCount } from "@/lib/sanity/queries";

/**
 * Compact modal listing every category. Trigger is a pill button; modal is
 * a single editorial card with a flat two-column list of topics — title
 * left, post count right. Click a row to filter the blog.
 */
export default function TopicBrowserDialog({
  categories,
  activeCategory,
  triggerLabel = "All topics",
}: {
  categories: CategoryWithCount[];
  activeCategory: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 20);
    // Capture the trigger node now so the cleanup uses a stable reference
    // — by the time cleanup runs the ref may already point at something
    // different (or unmounted), per react-hooks/exhaustive-deps.
    const triggerOnOpen = triggerRef.current;
    return () => {
      document.body.style.overflow = previous;
      window.clearTimeout(t);
      triggerOnOpen?.focus();
    };
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="group inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-surface-2/40 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <svg
          aria-hidden
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 16 16"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" d="M2 4h12M2 8h12M2 12h12" />
        </svg>
        {triggerLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Browse all topics"
          className="fixed inset-0 z-[200] flex items-start justify-center px-4 pb-[6vh] pt-[8vh] sm:items-center sm:pt-[10vh]"
        >
          <button
            type="button"
            aria-label="Close topic browser"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
          />

          <div className="relative z-[1] flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              <h2 className="text-base font-bold text-foreground">
                All topics
                <span className="ml-2 font-normal text-muted-foreground tabular-nums">
                  {categories.length}
                </span>
              </h2>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 rounded p-1.5 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg
                  aria-hidden
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6l12 12M6 18L18 6"
                  />
                </svg>
              </button>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto py-2">
              {categories.map((cat) => {
                const active = cat.slug.current === activeCategory;
                return (
                  <li key={cat._id}>
                    <Link
                      href={`/blog?category=${cat.slug.current}`}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "true" : undefined}
                      className={`flex items-baseline justify-between gap-4 px-6 py-3 transition-colors focus:outline-none focus-visible:bg-surface-2 ${
                        active
                          ? "bg-surface-2/60 text-accent"
                          : "text-foreground hover:bg-surface-2/60 hover:text-accent"
                      }`}
                    >
                      <span className="truncate text-base font-medium">
                        {cat.title}
                      </span>
                      <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                        {cat.postCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
