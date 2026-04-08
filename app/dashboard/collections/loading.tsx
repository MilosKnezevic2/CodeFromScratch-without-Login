export default function CollectionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 animate-pulse rounded bg-surface-2" />
        <div className="h-9 w-36 animate-pulse rounded-xl bg-surface-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-4 w-20 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
