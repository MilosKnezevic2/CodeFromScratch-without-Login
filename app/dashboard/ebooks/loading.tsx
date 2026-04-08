export default function EbooksLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-36 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="aspect-[3/4] animate-pulse bg-surface-2" />
            <div className="p-4 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
