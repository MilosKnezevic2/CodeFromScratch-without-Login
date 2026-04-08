const variants: Record<string, string> = {
  free: "bg-surface-2 text-muted-foreground",
  pro: "bg-accent/10 text-accent",
  "pro-plus": "bg-violet-500/10 text-violet-400",
  admin: "bg-red-500/10 text-red-400",
  user: "bg-surface-2 text-muted-foreground",
  active: "bg-green-500/10 text-green-400",
  canceled: "bg-red-500/10 text-red-400",
  banned: "bg-red-500/10 text-red-400",
  confirmed: "bg-green-500/10 text-green-400",
  pending: "bg-yellow-500/10 text-yellow-400",
};

export default function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const classes = variants[variant.toLowerCase()] || variants.user;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${classes}`}>
      {children}
    </span>
  );
}
