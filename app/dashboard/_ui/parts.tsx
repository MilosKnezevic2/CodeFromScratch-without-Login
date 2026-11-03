import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { PostCard } from "@/lib/sanity/queries";
import type { ActivityCell } from "@/lib/reader/rules";

/** An article cover; without an image, the title set on the site's dark cover style. */
export function Cover({ post, sizes, className = "" }: { post: PostCard; sizes: string; className?: string }) {
  if (post.featuredImage?.asset) {
    return (
      <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
        <Image src={urlFor(post.featuredImage).width(640).quality(75).url()} alt="" fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={`flex flex-col justify-end gap-1.5 bg-[#0e1426] p-4 ${className}`}>
      {post.category && <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-teal-300">{post.category}</span>}
      <span className="font-serif text-sm font-bold leading-tight text-slate-100 line-clamp-3">{post.title}</span>
    </div>
  );
}

export function Bar({ percent, label, className = "" }: { percent: number; label: string; className?: string }) {
  const value = Math.min(100, Math.max(0, Math.round(percent)));
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className={`h-1.5 overflow-hidden rounded-full bg-surface-2 ${className}`}>
      <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
    </div>
  );
}

/** The weekly goal as a ring: done / goal in the middle. */
export function GoalRing({ done, goal, size = 88 }: { done: number; goal: number; size?: number }) {
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const share = goal > 0 ? Math.min(1, done / goal) : 0;
  return (
    <svg role="img" aria-label={`Weekly goal: ${done} of ${goal} articles`} width={size} height={size} viewBox="0 0 88 88" className="shrink-0">
      <circle cx="44" cy="44" r={r} fill="none" strokeWidth="9" className="stroke-surface-2" />
      {share > 0 && (
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${share * circumference} ${circumference}`}
          transform="rotate(-90 44 44)"
          className="stroke-accent"
        />
      )}
      <text x="44" y="50" textAnchor="middle" className="fill-foreground" fontSize="20" fontWeight="800">
        {Math.min(done, 99)}/{goal}
      </text>
    </svg>
  );
}

const LEVEL_CLASS = ["bg-surface-2", "bg-accent/25", "bg-accent/45", "bg-accent/70", "bg-accent"];

function minutesLabel(seconds: number): string {
  if (seconds <= 0) return "no reading";
  const m = Math.round(seconds / 60);
  return m < 1 ? "under a minute" : `${m} min`;
}

/** Twelve weeks of reading days, one column a week, Monday on top. */
export function ActivityCalendar({ cells, activeDays }: { cells: ActivityCell[]; activeDays: number }) {
  return (
    <div>
      <div
        role="img"
        aria-label={`Reading in the last 12 weeks: ${activeDays} ${activeDays === 1 ? "day" : "days"} with reading`}
        className="grid grid-flow-col grid-rows-7 gap-1 sm:gap-[5px]"
        style={{ gridTemplateColumns: "repeat(12, minmax(0, 1.25rem))" }}
      >
        {cells.map((c) => (
          <span
            key={c.date}
            title={c.future ? undefined : `${c.date}: ${minutesLabel(c.seconds)}`}
            className={`aspect-square rounded-[4px] ${c.future ? "bg-transparent" : LEVEL_CLASS[c.level]}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground" aria-hidden="true">
        Less
        {LEVEL_CLASS.map((cls) => (
          <span key={cls} className={`h-3 w-3 rounded-[3px] ${cls}`} />
        ))}
        More
      </div>
    </div>
  );
}

export function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-surface p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{children}</p>;
}
