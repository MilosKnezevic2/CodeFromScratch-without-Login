import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadDesk } from "@/lib/reader/desk";
import { formatDuration, minutesLeft, pickForYou } from "@/lib/reader/rules";
import { requireReader } from "@/lib/reader/session";
import Greeting from "./Greeting";
import { ActivityCalendar, Bar, Cover, Eyebrow, GoalRing, SectionCard } from "./_ui/parts";

export const metadata: Metadata = {
  title: "Your dashboard",
  robots: { index: false, follow: false },
};

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function DashboardHome() {
  const reader = await requireReader("/dashboard");
  const desk = await loadDesk(reader.id);
  const { user, week, stats, bySlug } = desk;

  // "New since your last visit" compares with the visit before this one.
  after(() => prisma.user.update({ where: { id: reader.id }, data: { dashboardSeenAt: new Date() } }).then(() => undefined));

  const savedSet = new Set(desk.saved.map((s) => s.postSlug));
  const picks = pickForYou(desk.posts, desk.history, savedSet, user.dashboardSeenAt).flatMap((p) => {
    const post = bySlug.get(p.slug);
    return post ? [{ ...p, post }] : [];
  });
  const continueItems = desk.inProgress.slice(0, 3).flatMap((h) => {
    const post = bySlug.get(h.postSlug);
    return post ? [{ h, post }] : [];
  });
  const recentSaved = desk.saved.slice(0, 4).flatMap((s) => {
    const post = bySlug.get(s.postSlug);
    return post ? [post] : [];
  });
  const fresh = desk.history.length === 0 && desk.saved.length === 0;
  const left = Math.max(0, week.goal - week.thisWeek);

  const headline = !user.trackReading
    ? "Reading tracking is off, so nothing new is counted. You can turn it on in Profile and settings."
    : week.reached
      ? `You reached this week’s goal${week.streak > 1 ? `: ${week.streak} weeks in a row` : ""}. Anything more is a bonus.`
      : week.thisWeek === 0
        ? `Your goal is ${plural(week.goal, "article")} a week. Start with one of the picks below.`
        : `${plural(week.thisWeek, "article")} this week. ${left === 1 ? "One more" : `${left} more`} and you reach your goal.`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Greeting firstName={reader.name?.split(" ")[0] ?? null} />
          <p className="mt-2 text-base text-muted">{headline}</p>
        </div>
        <Link href="/blog" className="inline-flex min-h-11 items-center rounded-xl bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90">
          Find something to read
        </Link>
      </div>

      <section aria-label="This week" className="grid gap-4 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center gap-5 rounded-2xl border border-border bg-surface p-5">
          <GoalRing done={week.thisWeek} goal={week.goal} />
          <div>
            <Eyebrow>Weekly goal</Eyebrow>
            <p className="mt-1.5 text-lg font-bold text-foreground">
              {week.thisWeek} of {plural(week.goal, "article")}
            </p>
            <p className="mt-1 text-sm text-muted">
              Resets on Monday ·{" "}
              <Link href="/dashboard/account#goal" className="text-accent hover:underline">
                Change goal
              </Link>
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <Eyebrow>Streak</Eyebrow>
          <p className="mt-1.5 flex items-center gap-2 text-lg font-bold text-foreground">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
              <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5.5 1-8.5z" />
            </svg>
            {week.streak > 0 ? `${plural(week.streak, "week")} in a row` : "No streak yet"}
          </p>
          <div className="mt-4 flex gap-1.5" role="img" aria-label={`Last 8 weeks: goal reached in ${week.recent.filter((w) => w.reached).length}`}>
            {week.recent.map((w, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${w.reached ? "bg-accent" : w.current ? "bg-accent/25" : "bg-surface-2"}`} />
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">A week counts when you reach your goal.</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2 xl:col-span-1">
          <Eyebrow>Whole site</Eyebrow>
          <p className="mt-1.5 text-lg font-bold text-foreground">
            {stats.read} of {stats.total} articles · {stats.percentOfSite}%
          </p>
          <Bar percent={stats.percentOfSite} label="Share of the site read" className="mt-4 h-2" />
          <p className="mt-3 text-sm text-muted">{stats.seconds > 0 ? `${formatDuration(stats.seconds)} of reading so far` : "Your reading time adds up here"}</p>
        </div>
      </section>

      {fresh && (
        <SectionCard className="border-accent/40">
          <h2 className="text-lg font-extrabold text-foreground">Start here</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Open any article while logged in and it appears here with how far you got. Press Save on an article to keep it in your library, and sort it into folders
            later.
          </p>
        </SectionCard>
      )}

      {continueItems.length > 0 && (
        <section aria-labelledby="continue-h">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 id="continue-h" className="text-xl font-extrabold text-foreground">
              Continue reading
            </h2>
            {desk.inProgress.length > 3 && (
              <Link href="/dashboard/reading" className="text-sm text-accent hover:underline">
                All {desk.inProgress.length} in progress
              </Link>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {continueItems.map(({ h, post }) => {
              const mins = minutesLeft(post.readingTime, h.lastPercent);
              return (
                <li key={h.postSlug}>
                  <Link href={`/blog/${h.postSlug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/50">
                    <Cover post={post} sizes="(min-width: 1280px) 20rem, (min-width: 640px) 45vw, 100vw" className="aspect-[1200/630] w-full border-b border-border" />
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <p className="font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent">{post.title}</p>
                      <Bar percent={h.lastPercent} label={`Where you stopped: ${h.lastPercent}%`} className="mt-auto" />
                      <p className="flex items-center justify-between text-sm text-muted">
                        <span>
                          {h.lastPercent}%{mins ? ` · ${mins} min left` : ""}
                        </span>
                        <span className="font-bold text-accent">Resume</span>
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard>
          <h2 className="text-lg font-extrabold text-foreground">Picked for you</h2>
          <p className="mt-1 text-sm text-muted">From the topics you finish most. Articles published since your last visit are marked.</p>
          {picks.length === 0 ? (
            <p className="mt-4 text-sm text-muted">You have opened or saved every article on the site. New ones will show up here.</p>
          ) : (
            <ul className="mt-3">
              {picks.map((p) => (
                <li key={p.slug} className="border-t border-border first:border-t-0">
                  <Link href={`/blog/${p.slug}`} className="group flex items-center gap-4 py-3">
                    <Cover post={p.post} sizes="5rem" className="hidden aspect-square w-16 shrink-0 rounded-lg sm:flex" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold leading-snug text-foreground group-hover:text-accent">{p.post.title}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {p.reason}
                        {p.post.readingTime ? ` · ${p.post.readingTime} min` : ""}
                      </span>
                    </span>
                    {p.isNew && <span className="rounded-md bg-accent/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">New</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-extrabold text-foreground">Your topics</h2>
            <Link href="/dashboard/reading" className="text-sm text-accent hover:underline">
              Progress
            </Link>
          </div>
          <p className="mt-1 text-sm text-muted">Finish every article in a topic to tick it off.</p>
          <ul className="mt-4 space-y-3.5">
            {desk.topics.slice(0, 6).map((t) => (
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
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard>
          <h2 className="text-lg font-extrabold text-foreground">Your reading, last 12 weeks</h2>
          <p className="mb-4 mt-1 text-sm text-muted">Each square is a day; brighter means more minutes. Days count in UTC.</p>
          <ActivityCalendar cells={desk.activity} activeDays={desk.activeDays} />
        </SectionCard>

        <SectionCard>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-extrabold text-foreground">Recently saved</h2>
            <Link href="/dashboard/saved" className="text-sm text-accent hover:underline">
              Open library
            </Link>
          </div>
          {recentSaved.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nothing saved yet. Use the Save button on any article.</p>
          ) : (
            <ul className="mt-2">
              {recentSaved.map((post) => (
                <li key={post.slug} className="border-t border-border first:border-t-0">
                  <Link href={`/blog/${post.slug}`} className="block py-3 text-sm font-bold leading-snug text-foreground hover:text-accent">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-5 text-sm font-extrabold text-foreground">Milestones</h3>
          <ul className="mt-3 space-y-2.5">
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
    </div>
  );
}
