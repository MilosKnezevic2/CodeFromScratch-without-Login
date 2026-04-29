"use client";

import { useState } from "react";
import Comments from "./Comments";

/**
 * Collapsed-by-default wrapper for Comments. Most readers do not
 * scroll into the comments and the iframe (giscus or similar) is
 * heavy — keeping it collapsed cuts perceived weight at the foot
 * of the article and skips the iframe load entirely until the
 * reader opts in.
 */
export default function CommentsCollapse() {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-12 border-t border-border pt-10">
      <header className="flex items-baseline justify-between gap-4">
        <h2
          className="editorial-display text-2xl text-foreground sm:text-3xl"
          style={{ fontStyle: "normal" }}
        >
          The conversation
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:text-accent focus:outline-none focus-visible:underline"
        >
          {open ? "Hide ↑" : "Join in ↓"}
        </button>
      </header>
      {open ? (
        <div className="mt-8">
          <Comments />
        </div>
      ) : (
        <p className="editorial-body mt-4 max-w-prose text-muted-foreground">
          Sign in or comment as a guest. Click <em>Join in</em> to load the
          discussion.
        </p>
      )}
    </section>
  );
}
