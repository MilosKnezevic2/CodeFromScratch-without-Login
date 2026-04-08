interface KPICardProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
}

export default function KPICard({ label, value, change, prefix }: KPICardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="glow-border rounded-xl bg-surface p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-2xl font-extrabold text-foreground sm:text-3xl">
          {prefix}{typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {change !== undefined && change !== 0 && (
          <span className={`mb-1 flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-muted-foreground"}`}>
            <svg className={`h-3 w-3 ${isNegative ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}
