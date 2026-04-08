export default function SavedPostsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-2xl border border-border bg-surface p-4">
            <div className="h-20 w-28 shrink-0 animate-pulse rounded-xl bg-surface-2" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-2" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
              <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
