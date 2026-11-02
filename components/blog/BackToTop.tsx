"use client";

import { useEffect, useState } from "react";

/** Appears once the reader is past the first screen; a CSS transition fades and scales it. */
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      // The same boolean on most events, so React skips the render.
      setShow(window.scrollY > 500);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-8 right-8 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-surface text-muted shadow-lg transition duration-200 hover:bg-surface-2 hover:text-accent ${
        show ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
      }`}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
