"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISS_KEY = "cfs-home-mobile-subscribe-dismissed";

/**
 * Persistent bottom-bar Subscribe CTA on mobile only. Sticky,
 * dismissable, remembers dismissal in localStorage so we do not
 * pester returning visitors. Hides on desktop where the hero CTA
 * is already visible.
 */
export default function MobileSubscribeBar() {
  // Always rendered in the DOM. Starts translated off-screen and
  // only slides in if we did not find a dismissal flag in storage.
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    const t = window.setTimeout(() => setShow(true), 800);
    return () => window.clearTimeout(t);
  }, []);

  function dismiss() {
    setShow(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, "1");
    }
  }

  return (
    <div
      role="region"
      aria-label="Subscribe to the newsletter"
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            Sunday letter, every week.
          </p>
          <p className="editorial-meta">No fluff. Unsubscribe in a click.</p>
        </div>
        <Link
          href="#newsletter"
          className="whitespace-nowrap rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground"
        >
          Subscribe
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <svg
            aria-hidden
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
