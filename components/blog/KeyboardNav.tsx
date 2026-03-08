"use client";

import { useEffect } from "react";
import type { TocHeading } from "@/lib/portable-text-utils";

export default function KeyboardNav({ headings }: { headings: TocHeading[] }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key !== "j" && e.key !== "k") return;

      const ids = headings.map((h) => h.id);
      if (ids.length === 0) return;

      // Find current heading in viewport
      let currentIdx = -1;
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && el.getBoundingClientRect().top <= 100) {
          currentIdx = i;
          break;
        }
      }

      let nextIdx: number;
      if (e.key === "j") {
        nextIdx = Math.min(currentIdx + 1, ids.length - 1);
      } else {
        nextIdx = Math.max(currentIdx - 1, 0);
      }

      const target = document.getElementById(ids[nextIdx]);
      target?.scrollIntoView({ behavior: "smooth" });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [headings]);

  return null;
}
