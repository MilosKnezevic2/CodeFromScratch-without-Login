export default function BlogLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative overflow-hidden border-b border-border bg-surface py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-surface-2" />
            <div className="mx-auto mt-4 h-5 w-96 animate-pulse rounded-lg bg-surface-2" />
          </div>
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-surface-2" />
          ))}
        </div>
      </div>

      {/* Posts grid skeleton */}
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="aspect-[16/9] animate-pulse bg-surface-2" />
              <div className="p-5">
                <div className="flex gap-2">
                  <div className="h-5 w-16 animate-pulse rounded-full bg-surface-2" />
                  <div className="h-5 w-20 animate-pulse rounded-full bg-surface-2" />
                </div>
                <div className="mt-3 h-6 w-full animate-pulse rounded bg-surface-2" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-surface-2" />
                <div className="mt-4 h-4 w-24 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
