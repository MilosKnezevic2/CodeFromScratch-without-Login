"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary for the whole app. Without it, a failed server
 * render (Sanity or Postgres hiccup) shows Next's unstyled default error
 * screen; with it, readers get a branded page and a retry that re-renders
 * the route — usually enough once the upstream blip passes.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-4">
      <div className="mx-auto max-w-md text-center">
        <p className="gradient-text text-7xl font-black">500</p>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted">
          A temporary hiccup on our side — nothing you did. Try again in a
          moment.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="cta-glow rounded-lg px-6 py-2.5 text-sm font-semibold"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-accent/50 hover:text-foreground"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
