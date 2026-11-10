"use client";

import Link from "next/link";
import { useState } from "react";

export interface TopicChip {
  id: string;
  title: string;
  count: number;
  href: string;
  active: boolean;
}

/** Topics shown before "more": fewer on a phone, where each chip takes a whole line sooner. */
const FIRST_DESKTOP = 8;
const FIRST_PHONE = 4;

/**
 * The chips of the topic navigation (see CategoryRail). Chips wrap onto new
 * lines, so nothing scrolls sideways and no name is cut; past the first few
 * the rest open in place behind "+ N more".
 */
export default function TopicChips({ all, topics }: { all: TopicChip; topics: TopicChip[] }) {
  const [expanded, setExpanded] = useState(false);
  const restDesktop = Math.max(0, topics.length - FIRST_DESKTOP);
  const restPhone = Math.max(0, topics.length - FIRST_PHONE);

  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      active
        ? "border-foreground bg-foreground font-semibold text-background"
        : "border-border text-muted hover:border-foreground/40 hover:text-foreground"
    }`;
  const count = (active: boolean) => `font-mono text-[11px] tabular-nums ${active ? "opacity-70" : "text-muted-foreground"}`;

  return (
    <nav aria-label="Browse by topic" className="border-t border-border py-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="editorial-meta">Topics</p>
        {expanded && (
          <button type="button" onClick={() => setExpanded(false)} className="min-h-9 text-xs text-muted-foreground hover:text-foreground">
            Show fewer
          </button>
        )}
      </div>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href={all.href} aria-current={all.active ? "page" : undefined} className={chip(all.active)}>
            {all.title}
            <span className={count(all.active)}>{all.count}</span>
          </Link>
        </li>
        {topics.map((t, i) => {
          // Collapsed: past the first few on a phone and past the first eight from tablet width up.
          const hidden = expanded ? "" : i >= FIRST_DESKTOP ? "hidden" : i >= FIRST_PHONE ? "hidden sm:block" : "";
          return (
            <li key={t.id} className={hidden}>
              <Link href={t.href} aria-current={t.active ? "page" : undefined} className={chip(t.active)}>
                {t.title}
                <span className={count(t.active)}>{t.count}</span>
              </Link>
            </li>
          );
        })}
        {!expanded && restPhone > 0 && (
          <li className={restDesktop > 0 ? "" : "sm:hidden"}>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-expanded={false}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 text-sm font-semibold text-accent transition-colors hover:border-accent/60"
            >
              <span className="sm:hidden">+ {restPhone} more</span>
              <span className="hidden sm:inline">+ {restDesktop} more</span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
