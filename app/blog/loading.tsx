/**
 * Skeleton state for /blog. Mirrors the production layout shipped
 * across PRs A-D so the perceived load looks like the page settling
 * into place, not a fresh paint. Uses tabular widths so layout shift
 * after hydration is minimal.
 */
export default function BlogLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading blog…</span>

      {/* Hero skeleton */}
      <section className="border-b border-border/60 bg-gradient-to-b from-background via-background to-surface/30 px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <div className="mx-auto h-3 w-40 animate-pulse rounded bg-surface-2" />
          <div className="mx-auto mt-4 h-12 w-[60%] animate-pulse rounded-lg bg-surface-2 sm:h-14" />
          <div className="mx-auto mt-3 h-12 w-[40%] animate-pulse rounded-lg bg-surface-2 sm:h-14" />
          <div className="mx-auto mt-5 h-5 w-[55%] animate-pulse rounded bg-surface-2" />
          <div className="mx-auto mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-2.5 w-20 animate-pulse rounded bg-surface-2" />
                <div className="h-6 w-16 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Toolbar skeleton */}
        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface/70 p-3 sm:flex-row">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-surface-2" />
          <div className="h-10 w-44 animate-pulse rounded-xl bg-surface-2" />
        </div>

        {/* Chip filters skeleton */}
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 w-20 animate-pulse rounded-full bg-surface-2"
            />
          ))}
        </div>

        {/* Featured skeleton */}
        <div className="mt-10 aspect-[16/9] animate-pulse rounded-3xl bg-surface-2 sm:aspect-[16/7]" />

        {/* Showcase 2x2 skeleton */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="aspect-[16/10] animate-pulse bg-surface-2" />
              <div className="space-y-3 p-5">
                <div className="flex gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-surface-2" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-surface-2" />
                </div>
                <div className="h-6 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="h-5 w-24 animate-pulse rounded bg-surface-2" />
                  <div className="h-4 w-16 animate-pulse rounded bg-surface-2" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Editorial list skeleton */}
        <div className="mt-16 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-5 rounded-xl border border-border bg-surface/50 p-4 sm:p-5"
            >
              <div className="hidden h-10 w-8 animate-pulse rounded bg-surface-2 sm:block" />
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-surface-2 sm:h-[72px] sm:w-[72px]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
                <div className="h-5 w-full animate-pulse rounded bg-surface-2" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
              </div>
              <div className="hidden h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-2 sm:block" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
