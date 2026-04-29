"use client";

import { useEffect, useState } from "react";
import SavePostButton from "./SavePostButton";

/**
 * Sticky floating rail visible on xl+ screens during a post read.
 * Mounts share + save + back-to-top affordances on the side of
 * the article so the reader can act without scrolling to the top
 * or bottom. The whole rail fades in once the user has scrolled
 * past the masthead so it does not compete with the headline.
 */
export default function FloatingActionRail({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function copyLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/blog/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore — best effort
    }
  }

  function shareNative() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/blog/${slug}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      copyLink();
    }
  }

  function scrollTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div
      aria-hidden={!show}
      className={`pointer-events-none fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 transition-opacity duration-300 xl:flex ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={shareNative}
        title="Share"
        aria-label="Share article"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-md transition hover:bg-background hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={copyLink}
        title="Copy link"
        aria-label="Copy article link"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-md transition hover:bg-background hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
      </button>
      <div className="pointer-events-auto">
        <SavePostButton postSlug={slug} iconOnly />
      </div>
      <button
        type="button"
        onClick={scrollTop}
        title="Back to top"
        aria-label="Scroll back to top"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-md transition hover:bg-background hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
            d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
          />
        </svg>
      </button>
    </div>
  );
}
