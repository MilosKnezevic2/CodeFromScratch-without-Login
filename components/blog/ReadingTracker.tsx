"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { shouldOfferResume } from "@/lib/reader/rules";

const REPORT_EVERY_MS = 20_000;

/** How far through the article the reader is, 0-100, measured on the article body. */
function articlePercent(): number {
  const el = document.getElementById("article-content");
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((window.innerHeight - r.top) / r.height) * 100)));
}

/**
 * For a signed-in reader: records how far they got and how long they spent
 * while the page was visible (only if they have not switched tracking off),
 * and offers to jump back to where they stopped last time. Visitors who are
 * not signed in get nothing from this component and send nothing.
 */
export default function ReadingTracker({ slug }: { slug: string }) {
  const { status } = useSession();
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const visibleMs = useRef(0);
  const visibleSince = useRef<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    void fetch(`/api/me/reading?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { lastPercent?: number }) => {
        if (!cancelled && typeof d.lastPercent === "number" && shouldOfferResume(d.lastPercent) && articlePercent() < d.lastPercent - 5) {
          setResumeAt(d.lastPercent);
        }
      })
      .catch(() => {});

    const takeSeconds = () => {
      const now = Date.now();
      if (visibleSince.current !== null) {
        visibleMs.current += now - visibleSince.current;
        visibleSince.current = document.visibilityState === "visible" ? now : null;
      }
      const seconds = Math.round(visibleMs.current / 1000);
      visibleMs.current -= seconds * 1000;
      return seconds;
    };
    const report = (beacon: boolean) => {
      const body = JSON.stringify({ slug, percent: articlePercent(), seconds: takeSeconds() });
      if (beacon && navigator.sendBeacon) navigator.sendBeacon("/api/me/reading", new Blob([body], { type: "application/json" }));
      else void fetch("/api/me/reading", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    };

    visibleSince.current = document.visibilityState === "visible" ? Date.now() : null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") report(true);
      else visibleSince.current = Date.now();
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") report(false);
    }, REPORT_EVERY_MS);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => report(true), { once: true });

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      report(true);
    };
  }, [status, slug]);

  useEffect(() => {
    if (resumeAt === null) return;
    const hide = () => {
      if (articlePercent() >= resumeAt - 5) setResumeAt(null);
    };
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [resumeAt]);

  if (resumeAt === null) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4" role="status">
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface/95 py-1.5 pl-4 pr-1.5 text-sm text-foreground shadow-xl backdrop-blur">
        <span>You stopped at {resumeAt}%.</span>
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById("article-content");
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top: top + (el.offsetHeight * resumeAt) / 100 - window.innerHeight, behavior: "smooth" });
            }
            setResumeAt(null);
          }}
          className="min-h-9 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground"
        >
          Continue reading
        </button>
        <button type="button" onClick={() => setResumeAt(null)} aria-label="Dismiss" className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
