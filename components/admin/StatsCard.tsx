interface StatsCardProps {
  label: string;
  value: string | number;
  change?: string;
}

export default function StatsCard({ label, value, change }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {change && <p className="mt-1 text-xs text-accent">{change}</p>}
    </div>
  );
}
