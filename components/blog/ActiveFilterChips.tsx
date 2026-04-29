import Link from "next/link";

export type FilterChip = {
  label: string;
  value: string;
  removeHref: string;
  tone?: "category" | "tag" | "search" | "sort";
};

const TONES: Record<NonNullable<FilterChip["tone"]>, string> = {
  category: "border-accent/40 bg-accent/10 text-accent",
  tag: "border-accent-2/40 bg-accent-2/10 text-accent-2",
  search:
    "border-yellow-500/40 bg-yellow-500/10 text-yellow-300 dark:text-yellow-200",
  sort: "border-border bg-surface-2 text-muted-foreground",
};

export default function ActiveFilterChips({
  chips,
  clearHref,
}: {
  chips: FilterChip[];
  clearHref: string;
}) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Filtered by
      </span>
      {chips.map((chip) => {
        const tone = TONES[chip.tone ?? "category"];
        return (
          <Link
            key={`${chip.tone ?? "category"}:${chip.value}`}
            href={chip.removeHref}
            aria-label={`Remove ${chip.label} filter`}
            className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition hover:bg-opacity-20 ${tone}`}
          >
            <span className="text-[10px] uppercase tracking-wide opacity-70">
              {chip.label}
            </span>
            <span className="font-bold">{chip.value}</span>
            <span
              aria-hidden
              className="text-base leading-none opacity-60 transition group-hover:opacity-100"
            >
              ×
            </span>
          </Link>
        );
      })}
      {chips.length > 1 && (
        <Link
          href={clearHref}
          className="ml-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
        >
          Clear all
        </Link>
      )}
    </div>
  );
}
