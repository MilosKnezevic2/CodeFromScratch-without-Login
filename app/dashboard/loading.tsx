export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Welcome card skeleton */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 animate-pulse rounded-full bg-surface-2" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-32 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
            <div className="mt-3 h-8 w-12 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-4 w-48 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
