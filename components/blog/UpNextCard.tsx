"use client";

import { useEffect, useState } from "react";
import ReadingCard from "./ReadingCard";
import type { ReadingPick } from "@/lib/blog/keep-reading";

/**
 * One card beside the article on wide screens. It stays out of the way until
 * the reader is 60% through the text, then fades in and stays.
 */
export default function UpNextCard({ post }: { post: ReadingPick }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const article = document.getElementById("article-content");
    if (!article) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = article.getBoundingClientRect();
        if (r.height > 0 && (window.innerHeight - r.top) / r.height >= 0.6) {
          setShown(true);
          window.removeEventListener("scroll", onScroll);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={`transition duration-500 ease-out ${
        shown ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-accent">Up next</span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <ReadingCard post={post} sizes="288px" />
    </div>
  );
}
