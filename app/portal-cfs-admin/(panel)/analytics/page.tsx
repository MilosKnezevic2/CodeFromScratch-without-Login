import type { Metadata } from "next";
import Link from "next/link";
import DailyBars from "@/components/admin/analytics/DailyBars";
import ExcludeDevice from "@/components/admin/analytics/ExcludeDevice";
import KPICard from "@/components/admin/KPICard";
import { loadOutcomes, loadReport } from "@/lib/analytics/load";
import { loadSettings } from "@/lib/settings/store";
import {
  change,
  GOOD_FINISH_RATE,
  LOW_CTR,
  LOW_FINISH_RATE,
  LOW_STAY_RATE,
  MIN_IMPRESSIONS,
  MIN_VIEWS,
  percent,
  type ArticleRow,
  type RankedRow,
  type Report,
  type VerdictTone,
} from "@/lib/analytics/report";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

const BASE = "/portal-cfs-admin/analytics";
const RANGES = [7, 30, 90] as const;
const SORTS = [
  { id: "views", label: "Most read" },
  { id: "google", label: "Most seen in Google" },
  { id: "signups", label: "Most sign-ups" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

const STALE_SEARCH_DAYS = 7;

const TONE_STYLE: Record<VerdictTone, string> = {
  // Ink stays the text colour so the label stays readable in both themes.
  good: "bg-emerald-500/20 text-foreground",
  warn: "bg-amber-500/20 text-foreground",
  bad: "bg-red-500/20 text-foreground",
  neutral: "bg-surface-2 text-muted-foreground",
};

const shortDate = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const rate = (value: number | null) => (value === null ? "—" : `${value}%`);

function duration(seconds: number | null): string {
  if (seconds === null) return "—";
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function ToneBadge({ tone, label }: { tone: VerdictTone; label: string }) {
  return <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${TONE_STYLE[tone]}`}>{label}</span>;
}

function ListCard({ title, rows, empty }: { title: string; rows: RankedRow[]; empty: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="glow-border rounded-xl bg-surface p-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {row.label}
                  {row.tag && row.tag.toLowerCase() !== row.label && (
                    <span className="ml-2 text-xs text-muted-foreground">{row.tag}</span>
                  )}
                </span>
                <span className="font-semibold text-foreground">{row.value.toLocaleString()}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GoalBar({ label, value, goal, note }: { label: string; value: number; goal: number; note: string }) {
  const share = Math.min(100, (value / goal) * 100);
  return (
    <div className="glow-border rounded-xl bg-surface p-5">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-foreground">
        {value.toLocaleString()} <span className="text-base font-medium text-muted-foreground">of {goal.toLocaleString()}</span>
      </p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={goal}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${share}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function FunnelStep({ label, value, of, ofLabel }: { label: string; value: number; of?: number; ofLabel?: string }) {
  const share = of === undefined ? null : percent(value, of);
  return (
    <li className="glow-border rounded-xl bg-surface p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-foreground">{value.toLocaleString()}</p>
      {share !== null && (
        <p className="mt-1 text-xs text-muted-foreground">
          {share}% of {ofLabel}
        </p>
      )}
    </li>
  );
}

function sortArticles(articles: ArticleRow[], sort: SortId): ArticleRow[] {
  const score = (a: ArticleRow) => (sort === "google" ? a.impressions : sort === "signups" ? a.signups : a.views);
  return [...articles].sort((a, b) => score(b) - score(a) || b.impressions - a.impressions || b.views - a.views);
}

function ArticlesTable({ articles }: { articles: ArticleRow[] }) {
  if (articles.length === 0) {
    return (
      <p className="glow-border rounded-xl bg-surface p-8 text-center text-sm text-muted-foreground">
        The article list could not be loaded. Try again in a minute.
      </p>
    );
  }
  return (
    <div className="glow-border overflow-x-auto rounded-xl bg-surface">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="border-b border-border text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Article</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Views</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Stayed 30s+</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Finished</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Avg. time</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Sign-ups</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Google shown</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Clicks</th>
            <th scope="col" className="px-3 py-3 text-right font-semibold">Position</th>
            <th scope="col" className="px-4 py-3 font-semibold">What to do</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <tr key={article.slug} className="border-b border-border/60 align-top last:border-0">
              <td className="max-w-[260px] px-4 py-3">
                <a
                  href={`/blog/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-2 hover:underline"
                >
                  {article.title}
                </a>
                {article.category && <p className="mt-0.5 text-xs text-muted-foreground">{article.category}</p>}
              </td>
              <td className="px-3 py-3 text-right font-semibold text-foreground">{article.views.toLocaleString()}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{rate(article.stayedRate)}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{rate(article.finishedRate)}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{duration(article.avgSeconds)}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{article.signups}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{article.impressions.toLocaleString()}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">{article.clicks}</td>
              <td className="px-3 py-3 text-right text-muted-foreground">
                {article.position === null ? "—" : article.position.toFixed(1)}
              </td>
              <td className="min-w-[240px] px-4 py-3">
                <ToneBadge tone={article.verdict.tone} label={article.verdict.label} />
                <p className="mt-1 text-xs text-muted-foreground">{article.verdict.advice}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueriesTable({ rows, empty }: { rows: Report["queries"]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="py-2 pr-3 font-semibold">Search phrase</th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">Shown</th>
            <th scope="col" className="px-2 py-2 text-right font-semibold">Clicks</th>
            <th scope="col" className="py-2 pl-2 text-right font-semibold">Position</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.query} className="border-t border-border/60">
              <td className="py-2 pr-3 text-foreground">{row.query}</td>
              <td className="px-2 py-2 text-right text-muted-foreground">{row.impressions}</td>
              <td className="px-2 py-2 text-right text-muted-foreground">{row.clicks}</td>
              <td className="py-2 pl-2 text-right text-muted-foreground">{row.position.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const days = RANGES.find((range) => String(range) === params.days) ?? 30;
  const sort: SortId = SORTS.find((option) => option.id === params.sort)?.id ?? "views";

  const [report, outcomes, last30, { analytics: goals }] = await Promise.all([
    loadReport(days),
    loadOutcomes(),
    days === 30 ? null : loadReport(30),
    loadSettings(),
  ]);
  const deadline = shortDate(goals.goalDeadline);
  const { current, previous } = report;
  const monthlyVisits = (last30 ?? report).current.visits;
  const newSubscribers = current.confirmed - current.unsubscribed;

  const searchAge = report.searchAgeDays;

  const href = (next: { days?: number; sort?: SortId }) => {
    const query = new URLSearchParams();
    const nextDays = next.days ?? days;
    const nextSort = next.sort ?? sort;
    if (nextDays !== 30) query.set("days", String(nextDays));
    if (nextSort !== "views") query.set("sort", nextSort);
    const text = query.toString();
    return text ? `${BASE}?${text}` : BASE;
  };

  return (
    <div className="space-y-10">
      <ExcludeDevice />

      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <nav aria-label="Time range" className="flex gap-1">
            {RANGES.map((range) => (
              <Link
                key={range}
                href={href({ days: range })}
                aria-current={range === days ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition ${
                  range === days ? "bg-accent/15 text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range} days
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-sm text-muted-foreground">
          {report.countingSince
            ? `Site numbers are counted since ${shortDate(report.countingSince)}.`
            : "Site numbers start with the first real visit after this release."}{" "}
          {report.searchThrough
            ? `Google numbers run through ${shortDate(report.searchThrough)}, because Google reports a few days late.`
            : "Google numbers have not been loaded yet."}{" "}
          This device is not counted.
        </p>
        {searchAge !== null && searchAge > STALE_SEARCH_DAYS && (
          <p role="status" className="rounded-lg bg-amber-500/20 px-4 py-3 text-sm text-foreground">
            Google numbers are {searchAge} days old. The daily update has stopped, so it needs a look.
          </p>
        )}
      </header>

      <Section title="What to do next" hint="The clearest signals in this period.">
        {report.insights.length === 0 ? (
          <p className="glow-border rounded-xl bg-surface p-5 text-sm text-muted-foreground">
            Nothing clear yet. Small numbers can mislead, so verdicts appear only after {MIN_VIEWS} views or{" "}
            {MIN_IMPRESSIONS} Google impressions.
          </p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {report.insights.map((insight) => (
              <li key={insight.label} className="glow-border rounded-xl bg-surface p-4">
                <ToneBadge
                  tone={insight.tone}
                  label={insight.tone === "good" ? "Going well" : insight.tone === "bad" ? "Fix first" : insight.tone === "warn" ? "Worth improving" : "Note"}
                />
                <p className="mt-2 text-sm font-semibold text-foreground">{insight.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{insight.advice}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Last ${days} days`} hint={`Arrows compare with the ${days} days before.`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KPICard label="Visits" value={current.visits} change={change(current.visits, previous.visits)} />
          <KPICard label="Pages per visit" value={current.visits > 0 ? (current.views / current.visits).toFixed(1) : "—"} />
          <KPICard
            label="Stayed 30 seconds or more"
            value={rate(percent(current.stayed, current.views))}
          />
          <KPICard
            label="Articles read to the end"
            value={rate(percent(current.finished, current.articleViews))}
          />
          <KPICard label="New subscribers, net" value={newSubscribers} />
          <KPICard label="Clicks from Google" value={current.clicks} change={change(current.clicks, previous.clicks)} />
        </div>
      </Section>

      <Section
        title="From stranger to subscriber"
        hint="Where people drop out. Each step is a share of the step before it."
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FunnelStep label="Shown in Google" value={current.impressions} />
          <FunnelStep label="Clicked from Google" value={current.clicks} of={current.impressions} ofLabel="shown" />
          <FunnelStep label="Article views" value={current.articleViews} />
          <FunnelStep label="Read to the end" value={current.finished} of={current.articleViews} ofLabel="views" />
          <FunnelStep label="Asked to subscribe" value={current.signups} of={current.views} ofLabel="page views" />
          <FunnelStep label="Confirmed by email" value={current.confirmed} of={current.signups} ofLabel="requests" />
        </ol>
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyBars
          title="Visits per day"
          unit="visits"
          points={report.dailyVisits}
          emptyText="Visits appear here from the first real visit after this release."
        />
        <DailyBars
          title="Google impressions per day"
          unit="impressions"
          points={report.dailyImpressions}
          emptyText="No Google data for this period yet."
        />
      </div>

      <Section title="Goals" hint="Targets are set under Settings, Goals.">
        <div className="grid gap-4 md:grid-cols-3">
          <GoalBar
            label="Visits, last 30 days"
            value={monthlyVisits}
            goal={goals.monthlyVisitsGoal}
            note={`Goal by ${deadline}.`}
          />
          <GoalBar
            label="Confirmed subscribers"
            value={outcomes.confirmedSubscribers}
            goal={goals.subscribersGoal}
            note={`Goal by ${deadline}. ${outcomes.waitingSubscribers} still waiting to confirm.`}
          />
          <GoalBar
            label="Subscribers needed for the ebook"
            value={outcomes.confirmedSubscribers}
            goal={goals.ebookSubscribersGate}
            note={`Course waitlist: ${outcomes.waitlistConfirmed} confirmed.`}
          />
        </div>
      </Section>

      <Section title="Every article" hint="Numbers for this period, with one next step for each.">
        <nav aria-label="Sort articles" className="flex flex-wrap gap-1">
          {SORTS.map((option) => (
            <Link
              key={option.id}
              href={href({ sort: option.id })}
              aria-current={option.id === sort ? "true" : undefined}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition ${
                option.id === sort ? "bg-accent/15 text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
        <ArticlesTable articles={sortArticles(report.articles, sort)} />
        <p className="text-xs text-muted-foreground">
          How verdicts work: judged on reading after {MIN_VIEWS} views, on Google after {MIN_IMPRESSIONS} impressions.
          Under {LOW_STAY_RATE}% staying is &quot;leave fast&quot;, under {LOW_FINISH_RATE}% finishing is &quot;stop
          early&quot;, {GOOD_FINISH_RATE}% or more finishing is good, and under {LOW_CTR}% clicks on page 1 is &quot;seen, not
          clicked&quot;. These lines are our own judgement and can be adjusted as data grows.
        </p>
      </Section>

      <Section title="Where people come from" hint="Counted once per visit, when someone arrives from outside the site.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ListCard title="Type of source" rows={report.sourceKinds} empty="No visits yet." />
          <ListCard title="Exact sources" rows={report.sources} empty="No visits yet." />
          <ListCard title="First page they saw" rows={report.landingPages} empty="No visits yet." />
          <ListCard title="Countries" rows={report.countries} empty="No visits yet." />
          <ListCard title="Devices" rows={report.devices} empty="No visits yet." />
          <ListCard title="Other pages viewed" rows={report.otherPages} empty="No views yet." />
        </div>
      </Section>

      <Section title="What people search for" hint="From Google Search Console.">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Most shown</h3>
            <div className="mt-2">
              <QueriesTable rows={report.queries} empty="No search phrases in this period." />
            </div>
          </div>
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Close to page 1</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Positions 11 to 20: the cheapest wins.</p>
            <div className="mt-2">
              <QueriesTable rows={report.almostPageOne} empty="None in this period." />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Newsletter and actions">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">This period</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Confirmed", current.confirmed],
                ["Unsubscribed", current.unsubscribed],
                ["Joined the course waitlist", current.waitlist],
                ["Used a share button", current.shares],
                ["Opened a page that does not exist", current.missing],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="glow-border rounded-xl bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Latest letters</h3>
            {outcomes.letters.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No letters sent yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {outcomes.letters.map((letter) => (
                  <li
                    key={`${letter.subject}-${letter.sentAt?.toISOString()}`}
                    className="flex justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="min-w-0 truncate text-foreground">{letter.subject}</span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {letter.sentCount} sent{letter.failedCount > 0 ? `, ${letter.failedCount} failed` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>

      <Section title="What this page cannot tell you">
        <div className="glow-border rounded-xl bg-surface p-5 text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-foreground">Returning readers.</strong> The site stores nothing on a visitor&apos;s
              device, so two visits by one person look like two strangers. Confirmed subscribers are the honest stand-in.
            </li>
            <li>
              <strong className="text-foreground">Email opens and clicks.</strong> Not tracked, as promised to readers.
              Visits from a letter appear under Direct. Replies are the signal to watch.
            </li>
            <li>
              <strong className="text-foreground">Speed.</strong> See{" "}
              <a
                href="https://vercel.com/milosknezevic2s-projects/codefromscratch/speed-insights"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2"
              >
                Vercel Speed Insights
              </a>
              . Its{" "}
              <a
                href="https://vercel.com/milosknezevic2s-projects/codefromscratch/analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2"
              >
                Web Analytics
              </a>{" "}
              is a good second opinion on the numbers here.
            </li>
          </ul>
        </div>
      </Section>
    </div>
  );
}
