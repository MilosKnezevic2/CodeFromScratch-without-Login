/**
 * Turns stored daily totals into the answers on the analytics page. Pure, so
 * every rate and verdict is tested without a database.
 */

export interface CounterRow {
  day: string;
  metric: string;
  key: string;
  value: number;
}

export interface SearchRow {
  day: string;
  kind: "total" | "page" | "query";
  key: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface PostInfo {
  title: string;
  slug: string;
  publishedAt: string | null;
  category: string | null;
}

export type VerdictTone = "good" | "warn" | "bad" | "neutral";

export interface Verdict {
  tone: VerdictTone;
  label: string;
  advice: string;
}

export interface ArticleRow {
  title: string;
  slug: string;
  category: string | null;
  views: number;
  stayedRate: number | null;
  finishedRate: number | null;
  avgSeconds: number | null;
  signups: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  position: number | null;
  verdict: Verdict;
}

export interface Totals {
  visits: number;
  views: number;
  stayed: number;
  articleViews: number;
  halfRead: number;
  finished: number;
  signups: number;
  waitlist: number;
  shares: number;
  confirmed: number;
  unsubscribed: number;
  missing: number;
  seconds: number;
  clicks: number;
  impressions: number;
  position: number | null;
}

export type SourceKind = "Search" | "AI" | "Social" | "Direct" | "Other";

export interface RankedRow {
  label: string;
  value: number;
  tag?: string;
}

export interface QueryRow {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}

export interface DailyPoint {
  day: string;
  value: number;
}

export interface Report {
  days: number;
  current: Totals;
  previous: Totals;
  searchThrough: string | null;
  searchAgeDays: number | null;
  countingSince: string | null;
  dailyVisits: DailyPoint[];
  dailyImpressions: DailyPoint[];
  articles: ArticleRow[];
  sources: RankedRow[];
  sourceKinds: RankedRow[];
  countries: RankedRow[];
  devices: RankedRow[];
  landingPages: RankedRow[];
  otherPages: RankedRow[];
  queries: QueryRow[];
  almostPageOne: QueryRow[];
  insights: Verdict[];
}

/** Thresholds behind the verdicts. They are judgement calls, shown on the page as such. */
export const MIN_VIEWS = 20;
export const MIN_IMPRESSIONS = 30;
export const LOW_STAY_RATE = 25;
export const GOOD_FINISH_RATE = 40;
export const LOW_FINISH_RATE = 15;
export const GOOD_SIGNUP_RATE = 2;
export const LOW_CTR = 2;

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

export function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : null;
}

/** Percentage change, or undefined when there is nothing to compare with. */
export function change(current: number, previous: number): number | undefined {
  return previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined;
}

const AI_HOSTS = ["chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai", "gemini.google.com", "copilot.microsoft.com"];
const SEARCH_PATTERN = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia|brave|qwant|baidu|startpage)\./;
const SOCIAL_PATTERN =
  /(^|\.)(reddit|x|t|twitter|linkedin|facebook|instagram|youtube|pinterest|threads|bsky|mastodon|ycombinator|dev|hashnode|medium|github|stackoverflow)\.[a-z]+$/;

export function sourceKind(host: string): SourceKind {
  if (host === "direct") return "Direct";
  if (AI_HOSTS.some((ai) => host === ai || host.endsWith(`.${ai}`))) return "AI";
  if (SEARCH_PATTERN.test(host)) return "Search";
  if (SOCIAL_PATTERN.test(host)) return "Social";
  return "Other";
}

export function articleVerdict(row: {
  views: number;
  stayedRate: number | null;
  finishedRate: number | null;
  signups: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}): Verdict {
  const { views, stayedRate, finishedRate, signups, impressions, ctr, position } = row;

  if (views >= MIN_VIEWS) {
    const signupRate = percent(signups, views) ?? 0;
    if ((stayedRate ?? 0) < LOW_STAY_RATE) {
      return { tone: "bad", label: "Readers leave fast", advice: "Rework the opening. The first screen is not holding people." };
    }
    if (signupRate >= GOOD_SIGNUP_RATE) {
      return { tone: "good", label: "Working", advice: "It brings subscribers. Write more on this topic." };
    }
    if ((finishedRate ?? 0) >= GOOD_FINISH_RATE) {
      return signups === 0
        ? { tone: "warn", label: "Read, no sign-ups", advice: "People finish it. Make the sign-up offer fit this topic." }
        : { tone: "good", label: "Working", advice: "People finish it. Write more like this one." };
    }
    if ((finishedRate ?? 0) < LOW_FINISH_RATE) {
      return { tone: "warn", label: "Readers stop early", advice: "Check where it gets slow, or shorten it." };
    }
  }

  if (impressions >= MIN_IMPRESSIONS && position !== null) {
    if (position <= 10 && (ctr ?? 0) < LOW_CTR) {
      return { tone: "warn", label: "Seen, not clicked", advice: "Page 1 of Google, few clicks. Rewrite the title and description." };
    }
    if (position <= 10) {
      return { tone: "good", label: "Strong in Google", advice: "Keep it updated and link to it from new articles." };
    }
    if (position <= 20) {
      return { tone: "warn", label: "Almost page 1", advice: "Close to page 1. Improve it and link to it from other articles." };
    }
    return {
      tone: "neutral",
      label: "Ranks low",
      advice: `Google knows it, but at position ${Math.round(position)}. Compare it with the pages above it.`,
    };
  }

  if (views === 0 && impressions === 0) {
    return { tone: "neutral", label: "No traffic yet", advice: "Nobody has found it in this period." };
  }
  return { tone: "neutral", label: "Too little data", advice: "Wait for more visits before judging it." };
}

function sumBy(rows: CounterRow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.key, (totals.get(row.key) ?? 0) + row.value);
  return totals;
}

function ranked(totals: Map<string, number>, limit = 10): RankedRow[] {
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }));
}

function totalsFor(counters: CounterRow[], search: SearchRow[]): Totals {
  const metric = (name: string) => counters.filter((c) => c.metric === name);
  const sum = (name: string) => metric(name).reduce((total, c) => total + c.value, 0);
  const onArticles = (name: string) =>
    metric(name)
      .filter((c) => isArticleKey(c.key))
      .reduce((total, c) => total + c.value, 0);

  const searchTotals = search.filter((s) => s.kind === "total");
  const impressions = searchTotals.reduce((total, s) => total + s.impressions, 0);
  const weighted = searchTotals.reduce((total, s) => total + s.position * s.impressions, 0);

  return {
    visits: sum("entry"),
    views: sum("view"),
    stayed: sum("engaged"),
    articleViews: onArticles("view"),
    halfRead: sum("read50"),
    finished: sum("read90"),
    signups: sum("signup"),
    waitlist: sum("waitlist"),
    shares: sum("share"),
    confirmed: sum("confirmed"),
    unsubscribed: sum("unsubscribe"),
    missing: sum("notfound"),
    seconds: sum("seconds"),
    clicks: searchTotals.reduce((total, s) => total + s.clicks, 0),
    impressions,
    position: impressions > 0 ? weighted / impressions : null,
  };
}

function isArticleKey(key: string): boolean {
  return /^\/blog\/[^/*]+$/.test(key) && !key.startsWith("/blog/category") && !key.startsWith("/blog/tag");
}

function dailySeries(start: string, days: number, values: Map<string, number>): DailyPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const day = addDays(start, index);
    return { day, value: values.get(day) ?? 0 };
  });
}

function queriesFrom(rows: SearchRow[]): QueryRow[] {
  const grouped = new Map<string, { clicks: number; impressions: number; weighted: number }>();
  for (const row of rows) {
    const entry = grouped.get(row.key) ?? { clicks: 0, impressions: 0, weighted: 0 };
    entry.clicks += row.clicks;
    entry.impressions += row.impressions;
    entry.weighted += row.position * row.impressions;
    grouped.set(row.key, entry);
  }
  return [...grouped.entries()].map(([query, entry]) => ({
    query,
    clicks: entry.clicks,
    impressions: entry.impressions,
    position: entry.impressions > 0 ? entry.weighted / entry.impressions : 0,
  }));
}

export function buildReport(input: {
  days: number;
  today: string;
  counters: CounterRow[];
  search: SearchRow[];
  posts: PostInfo[];
  countingSince: string | null;
}): Report {
  const { days, today, counters, search, posts, countingSince } = input;
  const start = addDays(today, -(days - 1));
  const previousStart = addDays(start, -days);

  // Google reports with a delay of a few days, so its window ends on its newest day.
  const searchThrough = search.reduce<string | null>(
    (latest, row) => (row.kind === "total" && (!latest || row.day > latest) ? row.day : latest),
    null,
  );
  const searchEnd = searchThrough ?? today;
  const searchStart = addDays(searchEnd, -(days - 1));
  const searchPreviousStart = addDays(searchStart, -days);

  const currentCounters = counters.filter((c) => c.day >= start && c.day <= today);
  const previousCounters = counters.filter((c) => c.day >= previousStart && c.day < start);
  const currentSearch = search.filter((s) => s.day >= searchStart && s.day <= searchEnd);
  const previousSearch = search.filter((s) => s.day >= searchPreviousStart && s.day < searchStart);

  const of = (metric: string) => sumBy(currentCounters.filter((c) => c.metric === metric));
  const views = of("view");
  const stayed = of("engaged");
  const finished = of("read90");
  const seconds = of("seconds");
  const signups = of("signup");

  const searchPages = new Map<string, { clicks: number; impressions: number; weighted: number }>();
  for (const row of currentSearch.filter((s) => s.kind === "page")) {
    const entry = searchPages.get(row.key) ?? { clicks: 0, impressions: 0, weighted: 0 };
    entry.clicks += row.clicks;
    entry.impressions += row.impressions;
    entry.weighted += row.position * row.impressions;
    searchPages.set(row.key, entry);
  }

  const articles: ArticleRow[] = posts.map((post) => {
    const key = `/blog/${post.slug}`;
    const pageViews = views.get(key) ?? 0;
    const google = searchPages.get(key);
    const impressions = google?.impressions ?? 0;
    const row = {
      title: post.title,
      slug: post.slug,
      category: post.category,
      views: pageViews,
      stayedRate: percent(stayed.get(key) ?? 0, pageViews),
      finishedRate: percent(finished.get(key) ?? 0, pageViews),
      avgSeconds: pageViews > 0 ? Math.round((seconds.get(key) ?? 0) / pageViews) : null,
      signups: signups.get(key) ?? 0,
      impressions,
      clicks: google?.clicks ?? 0,
      ctr: percent(google?.clicks ?? 0, impressions),
      position: google && impressions > 0 ? google.weighted / impressions : null,
    };
    return { ...row, verdict: articleVerdict(row) };
  });

  const sourceTotals = of("source");
  const kindTotals = new Map<string, number>();
  for (const [host, value] of sourceTotals) {
    const kind = sourceKind(host);
    kindTotals.set(kind, (kindTotals.get(kind) ?? 0) + value);
  }

  const queries = queriesFrom(currentSearch.filter((s) => s.kind === "query"));
  const dailyEntries = sumDaily(currentCounters.filter((c) => c.metric === "entry"), (c) => c.day, (c) => c.value);
  const dailySearch = sumDaily(currentSearch.filter((s) => s.kind === "total"), (s) => s.day, (s) => s.impressions);

  return {
    days,
    current: totalsFor(currentCounters, currentSearch),
    previous: totalsFor(previousCounters, previousSearch),
    searchThrough,
    searchAgeDays: searchThrough
      ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${searchThrough}T00:00:00Z`)) / 86_400_000)
      : null,
    countingSince,
    dailyVisits: dailySeries(start, days, dailyEntries),
    dailyImpressions: dailySeries(searchStart, days, dailySearch),
    articles,
    sources: ranked(sourceTotals).map((row) => ({ ...row, tag: sourceKind(row.label) })),
    sourceKinds: ranked(kindTotals),
    countries: ranked(of("country")),
    devices: ranked(of("device")),
    landingPages: ranked(of("entry")),
    otherPages: ranked(new Map([...views].filter(([key]) => !isArticleKey(key)))),
    queries: [...queries].sort((a, b) => b.impressions - a.impressions).slice(0, 15),
    almostPageOne: queries
      .filter((q) => q.position > 10 && q.position <= 20 && q.impressions >= 5)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 8),
    insights: buildInsights(articles, queries),
  };
}

function sumDaily<T>(rows: T[], day: (row: T) => string, value: (row: T) => number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(day(row), (totals.get(day(row)) ?? 0) + value(row));
  return totals;
}

const TONE_ORDER: Record<VerdictTone, number> = { bad: 0, warn: 1, good: 2, neutral: 3 };

/** The few sentences worth reading first: the biggest pages with a clear next step. */
function buildInsights(articles: ArticleRow[], queries: QueryRow[]): Verdict[] {
  const clear = articles
    .filter((a) => ["bad", "warn", "good"].includes(a.verdict.tone))
    .sort(
      (a, b) =>
        TONE_ORDER[a.verdict.tone] - TONE_ORDER[b.verdict.tone] ||
        b.views + b.impressions - (a.views + a.impressions),
    )
    .slice(0, 4)
    .map((a) => ({
      tone: a.verdict.tone,
      label: `${a.verdict.label}: ${a.title}`,
      advice: a.verdict.advice,
    }));

  const biggest = articles.reduce<ArticleRow | null>(
    (top, a) => (a.impressions > (top?.impressions ?? 0) ? a : top),
    null,
  );
  if (clear.length === 0 && biggest && biggest.impressions >= MIN_IMPRESSIONS) {
    clear.push({
      tone: biggest.verdict.tone,
      label: `Biggest in Google: ${biggest.title}`,
      advice: biggest.verdict.advice,
    });
  }

  const nearOne = [...queries]
    .filter((q) => q.position > 10 && q.position <= 20 && q.impressions >= 5)
    .sort((a, b) => b.impressions - a.impressions)[0];
  if (nearOne) {
    clear.push({
      tone: "warn",
      label: `Close to page 1 for "${nearOne.query}"`,
      advice: `Position ${Math.round(nearOne.position)}, ${nearOne.impressions} times shown. Cover this phrase better in the article that ranks for it.`,
    });
  }
  return clear.slice(0, 5);
}
