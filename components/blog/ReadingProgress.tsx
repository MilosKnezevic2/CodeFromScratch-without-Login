"use client";

import { useEffect, useRef } from "react";

/**
 * The thin bar along the top that fills as the reader scrolls. The scroll
 * handler writes straight to the element's transform — no state, no render
 * per scroll event — and a CSS transition smooths the steps, so the article
 * route carries no animation library for it.
 */
export default function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const root = document.documentElement;
      const range = root.scrollHeight - root.clientHeight;
      const pct = range > 0 ? Math.min(1, root.scrollTop / range) : 0;
      el.style.transform = `scaleX(${pct})`;
      el.style.opacity = pct < 0.01 ? "0" : "1";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] origin-left opacity-0 transition-[transform,opacity] duration-150 ease-out"
      style={{
        transform: "scaleX(0)",
        background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-2))",
        boxShadow: "0 0 12px rgba(45, 212, 191, 0.5), 0 0 4px rgba(45, 212, 191, 0.3)",
      }}
    />
  );
}
