import type { Metadata } from "next";
import Link from "next/link";
import { loadDesk } from "@/lib/reader/desk";
import { formatDuration, READ_AT_PERCENT } from "@/lib/reader/rules";
import { requireReader } from "@/lib/reader/session";
import { ActivityCalendar, Bar, Eyebrow, SectionCard } from "../_ui/parts";
import TrackingControls from "./TrackingControls";

export const metadata: Metadata = {
  title: "Your reading progress",
  robots: { index: false, follow: false },
};

export default async function ProgressPage() {
  const reader = await requireReader("/dashboard/reading");
  const desk = await loadDesk(reader.id);
  const { stats, week, bySlug } = desk;
  const history = desk.history.slice(0, 300);

  const tiles = [
    { label: "Articles read", value: `${stats.read} of ${stats.total}`, note: `${stats.percentOfSite}% of the site` },
    { label: "Time reading", value: stats.seconds > 0 ? formatDuration(stats.seconds) : "0 min", note: "While an article was on screen" },
    { label: "Streak", value: `${week.streak} ${week.streak === 1 ? "week" : "weeks"}`, note: `Goal: ${week.goal} a week` },
    { label: "Reading days", value: String(desk.activeDays), note: "In the last 12 weeks" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Progress</h1>
        <p className="mt-2 text-sm text-muted">What you have read, by topic and over time. Only you see this.</p>
      </div>

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <Eyebrow>{t.label}</Eyebrow>
            <p className="mt-2 text-2xl font-extrabold text-foreground">{t.value}</p>
            <p className="mt-1 text-xs text-muted">{t.note}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard>
          <h2 className="text-lg font-extrabold text-foreground">Last 12 weeks</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Each square is a day; brighter means more minutes. Days count in UTC.</p>
          <ActivityCalendar cells={desk.activity} activeDays={desk.activeDays} />
        </SectionCard>
        <SectionCard>
          <h2 className="text-lg font-extrabold text-foreground">Milestones</h2>
          <ul className="mt-4 space-y-3">
            {desk.milestones.map((m) => (
              <li key={m.label} className={`flex items-center gap-3 text-sm ${m.done ? "text-foreground" : "text-muted"}`}>
                <span aria-hidden="true" className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold ${m.done ? "border-accent text-accent" : "border-border"}`}>
                  {m.mark}
                </span>
                {m.label}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard>
        <h2 className="text-lg font-extrabold text-foreground">Topics</h2>
        <ul className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {desk.topics.map((t) => (
            <li key={t.name}>
              <div className="mb-1.5 flex justify-between gap-4 text-sm">
                <span className="text-foreground">{t.name}</span>
                <span className={`font-mono text-xs ${t.read === t.total ? "text-accent" : "text-muted-foreground"}`}>{t.read === t.total ? "Done" : `${t.read} of ${t.total}`}</span>
              </div>
              <Bar percent={(t.read / t.total) * 100} label={`${t.name}: ${t.read} of ${t.total} read`} />
            </li>
          ))}
        </ul>
      </SectionCard>

      <section aria-labelledby="history-h" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="history-h" className="text-xl font-extrabold text-foreground">
              Every article you opened
            </h2>
            <p className="mt-1 text-sm text-muted">How far you got and how long it was on your screen.</p>
          </div>
          <TrackingControls tracking={desk.user.trackReading} hasHistory={history.length > 0} />
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing yet.{" "}
            <Link href="/blog" className="text-accent underline underline-offset-2">
              Open an article
            </Link>{" "}
            while logged in and it appears here.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {history.map((h) => {
              const post = bySlug.get(h.postSlug);
              const done = Boolean(h.completedAt) || h.scrollPercent >= READ_AT_PERCENT;
              return (
                <li key={h.postSlug} className="p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    {post ? (
                      <Link href={`/blog/${h.postSlug}`} className="font-bold text-foreground hover:text-accent">
                        {post.title}
                      </Link>
                    ) : (
                      <span className="font-bold text-muted">{h.postSlug} (no longer published)</span>
                    )}
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${done ? "bg-accent/15 text-accent" : "bg-amber-400/15 text-amber-600 dark:text-amber-300"}`}>
                      {done ? "Read" : `${h.scrollPercent}% read`}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Bar percent={h.scrollPercent} label={`Furthest point: ${h.scrollPercent}%`} className="flex-1" />
                    <span className="whitespace-nowrap text-xs text-muted">
                      {formatDuration(h.secondsRead)} · {h.readAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
