"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export interface MenuTopic {
  title: string;
  slug: string;
  count: number;
}

/** "All 14 topics": every topic with articles, in a panel under the button. */
export default function TopicsMenu({ topics }: { topics: MenuTopic[] }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-border px-3 text-sm text-foreground transition hover:border-foreground/40"
      >
        All {topics.length} topics
        <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div id={panelId} className="absolute left-0 z-40 mt-2 w-[min(36rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-2 shadow-2xl sm:left-auto sm:right-0">
          <ul className="grid gap-0.5 sm:grid-cols-2">
            {topics.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/blog/category/${t.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm text-foreground transition hover:bg-surface-2"
                >
                  <span>{t.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
