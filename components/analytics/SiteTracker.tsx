"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { flushAnalytics, queueAnalytics, sendAnalytics } from "@/lib/analytics/client";

const ENGAGED_AFTER_MS = 30_000;
const ARTICLE_PATH = /^\/blog\/[^/]+$/;

function isTracked(pathname: string): boolean {
  return !pathname.startsWith("/portal-cfs-admin");
}

/** Hostname of the site that sent the reader here, or null for a direct visit or our own page. */
function externalReferrer(): string | null {
  if (!document.referrer) return null;
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? null : host;
  } catch {
    return null;
  }
}

function cameFromOwnSite(): boolean {
  return Boolean(document.referrer) && externalReferrer() === null;
}

function isRepeatLoad(): boolean {
  const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return navigation?.type === "reload" || navigation?.type === "back_forward";
}

/** How far through the article text the bottom of the screen has reached, 0 to 1 and beyond. */
function articleDepth(): number {
  const body = document.querySelector<HTMLElement>(".prose-editorial");
  if (!body) return 0;
  const { top, height } = body.getBoundingClientRect();
  return height > 0 ? (window.innerHeight - top) / height : 0;
}

/**
 * Counts page views, whether a reader stayed, and how far they read. It keeps
 * no state beyond the current page and writes nothing to the device, so two
 * visits by one person cannot be connected.
 *
 * The view is sent at once; staying, reading depth and time are queued and
 * leave together when the page is hidden or left, so one read costs the
 * database one or two writes instead of five.
 */
export default function SiteTracker() {
  const pathname = usePathname();
  const isFirstPage = useRef(true);

  useEffect(() => {
    const first = isFirstPage.current;
    isFirstPage.current = false;
    if (!isTracked(pathname)) return;

    const path = pathname;
    if (!(first && isRepeatLoad())) {
      sendAnalytics({
        type: "view",
        path,
        entry: first && !cameFromOwnSite(),
        referrer: first ? externalReferrer() : null,
      });
    }

    let visibleSince: number | null = document.visibilityState === "visible" ? performance.now() : null;
    let unsentMs = 0;
    let totalMs = 0;
    let engaged = false;

    const settle = () => {
      if (visibleSince === null) return;
      const elapsed = performance.now() - visibleSince;
      unsentMs += elapsed;
      totalMs += elapsed;
      visibleSince = performance.now();
    };

    const flushTime = () => {
      settle();
      const seconds = Math.round(unsentMs / 1000);
      if (seconds >= 1) {
        queueAnalytics({ type: "time", path, seconds });
        unsentMs = 0;
      }
      flushAnalytics();
    };

    const engagedTimer = window.setInterval(() => {
      settle();
      if (!engaged && totalMs >= ENGAGED_AFTER_MS) {
        engaged = true;
        queueAnalytics({ type: "milestone", path, name: "engaged" });
        window.clearInterval(engagedTimer);
      }
    }, 2000);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushTime();
        visibleSince = null;
      } else {
        visibleSince = performance.now();
      }
    };

    let reachedHalf = false;
    let reachedEnd = false;
    const onScroll = () => {
      const depth = articleDepth();
      if (!reachedHalf && depth >= 0.5) {
        reachedHalf = true;
        queueAnalytics({ type: "milestone", path, name: "read50" });
      }
      if (!reachedEnd && depth >= 0.9) {
        reachedEnd = true;
        queueAnalytics({ type: "milestone", path, name: "read90" });
        window.removeEventListener("scroll", onScroll);
      }
    };
    const tracksDepth = ARTICLE_PATH.test(path);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushTime);
    if (tracksDepth) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushTime);
      if (tracksDepth) window.removeEventListener("scroll", onScroll);
      window.clearInterval(engagedTimer);
      flushTime();
    };
  }, [pathname]);

  return null;
}
