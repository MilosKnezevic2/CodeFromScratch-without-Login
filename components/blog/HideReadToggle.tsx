"use client";

import Link from "next/link";

export default function HideReadToggle({
  active,
  toggleHref,
}: {
  active: boolean;
  toggleHref: string;
}) {
  return (
    <Link
      href={toggleHref}
      role="switch"
      aria-checked={active}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
      }`}
    >
      <span
        aria-hidden
        className={`relative inline-flex h-3.5 w-6 items-center rounded-full transition-colors ${
          active ? "bg-accent" : "bg-surface"
        }`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full bg-foreground transition-transform ${
            active ? "translate-x-2.5" : "translate-x-0.5"
          }`}
        />
      </span>
      Hide read
    </Link>
  );
}
