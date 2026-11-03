import type { Metadata } from "next";
import Link from "next/link";
import { publishedSlugs } from "@/lib/analytics/store";
import { prisma } from "@/lib/prisma";
import { formatDuration, READ_AT_PERCENT, readingStats } from "@/lib/reader/rules";
import { requireReader } from "@/lib/reader/session";
import { getPostCards } from "@/lib/sanity/queries";

export const metadata: Metadata = {
  title: "Your dashboard",
  robots: { index: false, follow: false },
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export default async function DashboardOverview() {
  const reader = await requireReader("/dashboard");
  const [user, history, saved, live] = await Promise.all([
    prisma.user.findUnique({ where: { id: reader.id }, select: { trackReading: true } }),
    prisma.readingHistory.findMany({
      where: { userId: reader.id },
      orderBy: { readAt: "desc" },
      select: { postSlug: true, scrollPercent: true, lastPercent: true, secondsRead: true, completedAt: true, readAt: true },
    }),
    prisma.savedPost.findMany({ where: { userId: reader.id }, orderBy: { createdAt: "desc" }, take: 5, select: { postSlug: true } }),
    publishedSlugs(),
  ]);
  const published = live ?? new Set<string>();
  const stats = readingStats(history, published);
  const inProgress = history.filter((h) => published.has(h.postSlug) && h.scrollPercent < READ_AT_PERCENT && !h.completedAt).slice(0, 5);
  const cards = await getPostCards([...new Set([...inProgress.map((h) => h.postSlug), ...saved.map((s) => s.postSlug)])]);
  const firstName = reader.name?.split(" ")[0];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground">{firstName ? `Hi, ${firstName}` : "Your dashboard"}</h1>
        <p className="mt-2 text-sm text-muted">Your reading, your saved articles and your folders, in one place.</p>
      </div>

      <section aria-label="Reading progress" className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Articles read"
          value={`${stats.read} of ${stats.total}`}
          note={`${stats.percentOfSite}% of everything on the site`}
        />
        <Stat label="Time reading" value={formatDuration(stats.seconds)} note="while an article was open on screen" />
        <Stat label="In progress" value={String(stats.started)} note="started, not finished" />
      </section>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${stats.percentOfSite}% of the site read`}>
        <div className="h-2 rounded-full bg-accent" style={{ width: `${stats.percentOfSite}%` }} />
      </div>

      {!user?.trackReading && (
        <p className="rounded-xl border border-border p-4 text-sm text-muted">
          Reading tracking is off, so new reading is not counted.{" "}
          <Link href="/dashboard/reading" className="text-accent underline underline-offset-2">
            Turn it on
          </Link>
        </p>
      )}

      <section aria-labelledby="continue-heading">
        <h2 id="continue-heading" className="text-lg font-bold text-foreground">
          Continue reading
        </h2>
        {inProgress.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing half-read. <Link href="/blog" className="text-accent underline underline-offset-2">Find something new</Link>.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {inProgress.map((h) => {
              const card = cards.get(h.postSlug);
              if (!card) return null;
              return (
                <li key={h.postSlug} className="rounded-xl border border-border bg-surface p-4">
                  <Link href={`/blog/${h.postSlug}`} className="font-semibold text-foreground hover:text-accent">
                    {card.title}
                  </Link>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${h.scrollPercent}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {h.scrollPercent}% · {formatDuration(h.secondsRead)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="saved-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="saved-heading" className="text-lg font-bold text-foreground">
            Recently saved
          </h2>
          <Link href="/dashboard/saved" className="text-sm text-accent hover:underline">
            All saved
          </Link>
        </div>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Use the Save button on an article to keep it here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface">
            {saved.map((s) => {
              const card = cards.get(s.postSlug);
              if (!card) return null;
              return (
                <li key={s.postSlug} className="p-4">
                  <Link href={`/blog/${s.postSlug}`} className="font-medium text-foreground hover:text-accent">
                    {card.title}
                  </Link>
                  {card.readingTime ? <span className="ml-2 text-xs text-muted-foreground">{card.readingTime} min</span> : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
