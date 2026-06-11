/**
 * Skeleton state for /blog. Mirrors the editorial magazine layout
 * (issue rule, asymmetric masthead, chart, side-by-side spread,
 * letterpress, pull-quote rows, date-indexed list) so the perceived
 * load looks like the page settling into print, not a flash of cards.
 */
export default function BlogLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the journal…</span>

      {/* Hero — issue rule + asymmetric masthead + stats */}
      <section className="border-b border-border/80 bg-background px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 border-b border-border/60 py-4">
            <div className="h-3 w-48 animate-pulse bg-surface-2" />
            <div className="ml-auto h-3 w-44 animate-pulse bg-surface-2" />
          </div>
          <div className="grid gap-8 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12">
            <div className="space-y-4 lg:col-span-8">
              <div className="h-20 w-[80%] animate-pulse bg-surface-2 sm:h-28" />
              <div className="h-20 w-[60%] animate-pulse bg-surface-2 sm:h-28" />
              <div className="h-20 w-[70%] animate-pulse bg-surface-2 sm:h-28" />
            </div>
            <div className="space-y-3 self-end lg:col-span-4">
              <div className="h-4 w-full animate-pulse bg-surface-2" />
              <div className="h-4 w-[80%] animate-pulse bg-surface-2" />
              <div className="h-4 w-[60%] animate-pulse bg-surface-2" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 py-4">
            <div className="flex gap-10">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-2.5 w-20 animate-pulse bg-surface-2" />
                  <div className="h-4 w-12 animate-pulse bg-surface-2" />
                </div>
              ))}
            </div>
            <div className="h-3 w-24 animate-pulse bg-surface-2" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="mt-10 border-y border-border py-4">
          <div className="h-6 w-full animate-pulse bg-surface-2" />
        </div>

        {/* Featured cover */}
        <div className="mt-20 border-t border-border pt-6">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="space-y-6 lg:col-span-7">
              <div className="h-3 w-24 animate-pulse bg-surface-2" />
              <div className="h-16 w-full animate-pulse bg-surface-2" />
              <div className="h-16 w-[80%] animate-pulse bg-surface-2" />
              <div className="h-5 w-[60%] animate-pulse bg-surface-2" />
              <div className="h-5 w-[40%] animate-pulse bg-surface-2" />
            </div>
            <div className="aspect-[1200/630] animate-pulse bg-surface-2 lg:col-span-5" />
          </div>
        </div>

        {/* Chart */}
        <div className="mt-24 border-t border-border pt-6">
          <div className="mb-10 flex items-baseline gap-4">
            <div className="h-3 w-12 animate-pulse bg-surface-2" />
            <div className="h-10 w-48 animate-pulse bg-surface-2" />
          </div>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="grid grid-cols-[8rem_1fr] gap-8 border-l-4 border-accent pl-6 lg:col-span-7">
              <div className="h-40 w-32 animate-pulse bg-surface-2" />
              <div className="space-y-4">
                <div className="h-12 w-full animate-pulse bg-surface-2" />
                <div className="h-12 w-[80%] animate-pulse bg-surface-2" />
                <div className="h-4 w-[50%] animate-pulse bg-surface-2" />
              </div>
            </div>
            <ol className="lg:col-span-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="grid grid-cols-[2.5rem_1fr_3rem] gap-4 border-b border-border py-4"
                >
                  <div className="h-8 w-8 animate-pulse bg-surface-2" />
                  <div className="space-y-2">
                    <div className="h-3 w-16 animate-pulse bg-surface-2" />
                    <div className="h-4 w-full animate-pulse bg-surface-2" />
                  </div>
                  <div className="h-3 w-12 animate-pulse bg-surface-2 ml-auto" />
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Asymmetric spread */}
        <div className="mt-24 border-t border-border pt-6">
          <div className="mb-10 flex items-baseline gap-4">
            <div className="h-3 w-12 animate-pulse bg-surface-2" />
            <div className="h-10 w-32 animate-pulse bg-surface-2" />
          </div>
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="space-y-6 lg:col-span-7">
              <div className="aspect-[1200/630] animate-pulse bg-surface-2" />
              <div className="space-y-3">
                <div className="h-3 w-16 animate-pulse bg-surface-2" />
                <div className="h-12 w-full animate-pulse bg-surface-2" />
                <div className="h-12 w-[70%] animate-pulse bg-surface-2" />
              </div>
            </div>
            <div className="space-y-12 lg:col-span-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[1200/630] animate-pulse bg-surface-2" />
                  <div className="h-3 w-16 animate-pulse bg-surface-2" />
                  <div className="h-7 w-full animate-pulse bg-surface-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editorial list */}
        <div className="mt-24 border-y border-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-6 border-t border-border py-6"
            >
              <div className="h-3 w-16 animate-pulse bg-surface-2" />
              <div className="space-y-2">
                <div className="h-3 w-20 animate-pulse bg-surface-2" />
                <div className="h-6 w-full animate-pulse bg-surface-2" />
                <div className="h-3 w-[40%] animate-pulse bg-surface-2" />
              </div>
              <div className="hidden h-6 w-6 animate-pulse bg-surface-2 sm:block" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
