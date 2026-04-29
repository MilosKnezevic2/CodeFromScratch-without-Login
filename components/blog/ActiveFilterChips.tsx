import Link from "next/link";

export type FilterChip = {
  label: string;
  value: string;
  removeHref: string;
  tone?: "category" | "tag" | "search" | "sort";
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
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 border-l-2 border-accent pl-4">
      <span className="editorial-meta text-foreground">
        Filtered
      </span>
      {chips.map((chip, i) => (
        <span
          key={`${chip.tone ?? "category"}:${chip.value}`}
          className="flex items-baseline gap-2 text-sm"
        >
          <span
            className="text-foreground"

          >
            {chip.label.toLowerCase()}: {chip.value}
          </span>
          <Link
            href={chip.removeHref}
            aria-label={`Remove ${chip.label} filter`}
            className="text-muted-foreground hover:text-foreground"
          >
            <span aria-hidden>×</span>
          </Link>
          {i < chips.length - 1 && (
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
          )}
        </span>
      ))}
      {chips.length > 1 && (
        <Link
          href={clearHref}
          className="ml-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear all
        </Link>
      )}
    </div>
  );
}
