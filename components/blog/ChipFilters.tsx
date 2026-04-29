import Link from "next/link";

type Group<T extends string> = {
  label: string;
  paramName: string;
  options: { value: T; label: string; hint?: string }[];
  active: T | "";
};

const READING_TIME: Group<"short" | "medium" | "long"> = {
  label: "Length",
  paramName: "readingTime",
  options: [
    { value: "short", label: "Short" },
    { value: "medium", label: "Standard" },
    { value: "long", label: "Long-form" },
  ],
  active: "",
};

const DIFFICULTY: Group<"beginner" | "intermediate" | "advanced"> = {
  label: "Level",
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
    <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
      {groups.map((group) => (
        <fieldset
          key={group.paramName}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-2"
        >
          <legend className="editorial-meta">{group.label}</legend>
          {group.options.map((opt, i) => {
            const isActive = group.active === opt.value;
            const href = buildHref({
              [group.paramName]: isActive ? null : opt.value,
              page: null,
            });
            return (
              <span
                key={opt.value}
                className="flex items-baseline gap-2 text-xs"
              >
                <Link
                  href={href}
                  aria-pressed={isActive}
                  className={`font-bold uppercase tracking-[0.16em] transition-colors ${
                    isActive
                      ? "text-foreground underline underline-offset-4"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </Link>
                {i < group.options.length - 1 && (
                  <span aria-hidden className="text-muted-foreground">
                    ·
                  </span>
                )}
              </span>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}
