import Link from "next/link";

type Group<T extends string> = {
  label: string;
  paramName: string;
  options: { value: T; label: string; hint?: string }[];
  active: T | "";
};

const READING_TIME: Group<"short" | "medium" | "long"> = {
  label: "Reading time",
  paramName: "readingTime",
  options: [
    { value: "short", label: "5 min", hint: "Quick reads" },
    { value: "medium", label: "10 min", hint: "Standard" },
    { value: "long", label: "Deep dive", hint: "12+ min" },
  ],
  active: "",
};

const DIFFICULTY: Group<"beginner" | "intermediate" | "advanced"> = {
  label: "Difficulty",
  paramName: "difficulty",
  options: [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ],
  active: "",
};

export type ChipFiltersValue = {
  readingTime: "short" | "medium" | "long" | "";
  difficulty: "beginner" | "intermediate" | "advanced" | "";
};

export default function ChipFilters({
  value,
  buildHref,
}: {
  value: ChipFiltersValue;
  buildHref: (overrides: Partial<Record<string, string | null>>) => string;
}) {
  const groups = [
    { ...READING_TIME, active: value.readingTime },
    { ...DIFFICULTY, active: value.difficulty },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
      {groups.map((group) => (
        <fieldset
          key={group.paramName}
          className="flex flex-wrap items-center gap-2"
        >
          <legend className="mr-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {group.label}
          </legend>
          {group.options.map((opt) => {
            const isActive = group.active === opt.value;
            const href = buildHref({
              [group.paramName]: isActive ? null : opt.value,
              page: null,
            });
            return (
              <Link
                key={opt.value}
                href={href}
                aria-pressed={isActive}
                title={opt.hint}
                className={`rounded-full border px-3 py-1 font-semibold transition ${
                  isActive
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-surface-2 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}
