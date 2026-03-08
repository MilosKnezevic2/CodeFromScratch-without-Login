"use client";

import { useEffect, useState, useMemo } from "react";
import type { TocHeading } from "@/lib/portable-text-utils";

const indentMap = { h2: "ml-0", h3: "ml-3", h4: "ml-6" };

export default function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState("");
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    const ids = headings.map((h) => h.id);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const pct = el.scrollHeight - el.clientHeight;
      setReadProgress(pct > 0 ? Math.round((el.scrollTop / pct) * 100) : 0);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Calculate which headings have been passed
  const activeIndex = useMemo(() => {
    const idx = headings.findIndex((h) => h.id === activeId);
    return idx >= 0 ? idx : -1;
  }, [headings, activeId]);

  if (headings.length === 0) return null;

  return (
    <nav>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-surface-3">
          <div
            className="h-1 rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all duration-300"
            style={{ width: `${readProgress}%` }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {readProgress}%
        </span>
      </div>

      <div className="toc-track space-y-0.5 pl-3.5">
        {/* Active progress bar on the track */}
        {activeIndex >= 0 && (
          <div
            className="absolute left-0 w-0.5 rounded-full bg-gradient-to-b from-accent to-accent-2 transition-all duration-300"
            style={{
              top: `${(activeIndex / headings.length) * 100}%`,
              height: `${(1 / headings.length) * 100}%`,
            }}
          />
        )}

        {headings.map((h) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            className={`block rounded-md px-3 py-1.5 text-[13px] leading-snug transition ${indentMap[h.level]} ${
              activeId === h.id
                ? "bg-accent/10 font-medium text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {h.text}
          </a>
        ))}
      </div>
    </nav>
  );
}
