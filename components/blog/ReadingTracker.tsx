"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface ReadingTrackerProps {
  slug: string;
}

export default function ReadingTracker({ slug }: ReadingTrackerProps) {
  const { data: session } = useSession();
  const lastReported = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!session?.user) return;

    function report(percent: number) {
      const clamped = Math.min(100, Math.max(0, Math.round(percent)));
      // Only report at milestones (every 25%) or completion
      const milestone = Math.floor(clamped / 25) * 25;
      if (milestone <= lastReported.current && clamped < 90) return;
      lastReported.current = Math.max(lastReported.current, milestone);

      fetch("/api/reading-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug: slug, scrollPercent: clamped }),
      }).catch(() => {});
    }

    // Report initial read
    report(0);

    function onScroll() {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        const percent = (window.scrollY / scrollHeight) * 100;
        report(percent);
      }, 500);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [session, slug]);

  return null;
}
