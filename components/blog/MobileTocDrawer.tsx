"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface TocHeading {
  text: string;
  id: string;
  level: "h2" | "h3" | "h4";
}

export default function MobileTocDrawer({ headings }: { headings: TocHeading[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (headings.length === 0) return null;

  const drawer = open && typeof window !== "undefined" ? createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 bottom-0 z-[9999] max-h-[70vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Table of Contents</h3>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="space-y-1">
          {headings.map((h) => (
            <a
              key={h.id}
              href={`#${h.id}`}
              onClick={() => setOpen(false)}
              className={`block rounded-lg px-3 py-2 text-sm transition hover:bg-surface-2 hover:text-accent ${
                h.level === "h2"
                  ? "font-medium text-foreground"
                  : "pl-6 text-muted-foreground"
              }`}
            >
              {h.text}
            </a>
          ))}
        </nav>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-2 text-xs font-semibold text-accent transition active:scale-95 hover:bg-accent/10"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
        Contents
      </button>
      {drawer}
    </>
  );
}
