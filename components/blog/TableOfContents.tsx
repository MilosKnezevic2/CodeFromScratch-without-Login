"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { groupHeadings, sectionIndexOf, type TocHeading } from "@/lib/portable-text-utils";

/**
 * "On this page" on wide screens: one numbered line per section (long titles
 * end in "…", the full title is in the tooltip), read sections fade, and the
 * subheadings show only under the section being read. Short enough to fit
 * the screen on long articles; if it still does not, the list scrolls inside.
 */
export default function TableOfContents({ headings, comments = false }: { headings: TocHeading[]; comments?: boolean }) {
  const [activeId, setActiveId] = useState("");
  const [readProgress, setReadProgress] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const sections = useMemo(() => groupHeadings(headings), [headings]);
  const activeIndex = sectionIndexOf(sections, activeId);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 },
    );
    for (const id of [...headings.map((h) => h.id), ...(comments ? ["comments"] : [])]) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings, comments]);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setReadProgress(max > 0 ? Math.round((el.scrollTop / max) * 100) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Should the list still be taller than the screen, keep the section being read in view. Only the list moves, never the page.
  useEffect(() => {
    const list = listRef.current;
    const link = activeIndex >= 0 ? list?.querySelector<HTMLElement>(`a[data-section="${activeIndex}"]`) : null;
    if (!list || !link || list.scrollHeight <= list.clientHeight) return;
    const top = link.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    if (top < list.scrollTop + 8 || top + link.offsetHeight > list.scrollTop + list.clientHeight - 8) {
      list.scrollTo({ top: Math.max(0, top - list.clientHeight / 3), behavior: "smooth" });
    }
  }, [activeIndex]);

  if (sections.length === 0) return null;

  const jump = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav aria-label="On this page" className="flex min-h-0 flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">On this page</p>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{readProgress}%</span>
      </div>
      <div className="mb-3 h-[3px] shrink-0 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${readProgress}%` }} />
      </div>

      <div ref={listRef} className="min-h-0 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        <ol className="space-y-px">
          {sections.map((s, i) => {
            const current = i === activeIndex;
            const read = activeIndex >= 0 && i < activeIndex;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  data-section={i}
                  title={s.text}
                  aria-current={current ? "location" : undefined}
                  onClick={jump(s.id)}
                  className={`flex items-baseline gap-2.5 rounded-lg px-2.5 py-1 text-[13px] leading-snug transition ${
                    current ? "bg-accent/12 font-bold text-foreground" : read ? "text-muted-foreground hover:text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  <span aria-hidden="true" className={`w-4 shrink-0 font-mono text-[10px] ${current ? "text-accent" : "text-muted-foreground"}`}>
                    {s.num}
                  </span>
                  <span className="truncate">{s.text}</span>
                </a>
                {current && s.subs.length > 0 && (
                  <ol className="mb-1 ml-[1.625rem] mt-0.5 space-y-px border-l border-border pl-2.5">
                    {s.subs.map((sub) => (
                      <li key={sub.id}>
                        <a
                          href={`#${sub.id}`}
                          title={sub.text}
                          aria-current={sub.id === activeId ? "location" : undefined}
                          onClick={jump(sub.id)}
                          className={`block truncate rounded-md px-2 py-0.5 text-xs transition ${sub.id === activeId ? "text-accent" : "text-muted hover:text-foreground"}`}
                        >
                          {sub.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ol>
        {comments && (
          <a
            href="#comments"
            aria-current={activeId === "comments" ? "location" : undefined}
            onClick={jump("comments")}
            className={`mt-2 flex items-center gap-2.5 rounded-lg border-t border-border px-2.5 pb-1 pt-2.5 text-[13px] transition ${
              activeId === "comments" ? "font-bold text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.8A8 8 0 1 1 21 12z" />
                </svg>
            Comments
          </a>
        )}
      </div>
    </nav>
  );
}
