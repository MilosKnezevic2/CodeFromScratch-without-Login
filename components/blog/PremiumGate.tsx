"use client";

import Link from "next/link";

export default function PremiumGate() {
  return (
    <div className="relative mt-8">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      <div className="relative rounded-xl border border-border bg-surface p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">Premium Content</h3>
        <p className="mt-2 text-sm text-muted">
          This article is available exclusively for Pro members.
          Upgrade to access all premium content.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-block rounded-lg gradient-btn px-6 py-2 text-sm font-medium transition"
        >
          Upgrade to Pro
        </Link>
      </div>
    </div>
  );
}
