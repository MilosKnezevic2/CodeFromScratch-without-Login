import { describe, expect, it } from "vitest";
import {
  addDays,
  articleVerdict,
  buildReport,
  change,
  percent,
  sourceKind,
  type CounterRow,
  type PostInfo,
  type SearchRow,
} from "./report";

const verdictInput = {
  views: 0,
  stayedRate: null,
  finishedRate: null,
  signups: 0,
  impressions: 0,
  ctr: null,
  position: null,
};

describe("small helpers", () => {
  it("adds days across a month and year", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("does not divide by zero, and caps at 100", () => {
    expect(percent(1, 0)).toBeNull();
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 4)).toBe(100);
  });

  it("shows no change when there is nothing to compare with", () => {
    expect(change(5, 0)).toBeUndefined();
    expect(change(15, 10)).toBe(50);
    expect(change(5, 10)).toBe(-50);
  });

  it("sorts traffic sources", () => {
    expect(sourceKind("direct")).toBe("Direct");
    expect(sourceKind("google.com")).toBe("Search");
    expect(sourceKind("google.at")).toBe("Search");
    expect(sourceKind("gemini.google.com")).toBe("AI");
    expect(sourceKind("chatgpt.com")).toBe("AI");
    expect(sourceKind("reddit.com")).toBe("Social");
    expect(sourceKind("old.reddit.com")).toBe("Social");
    expect(sourceKind("news.ycombinator.com")).toBe("Social");
    expect(sourceKind("someblog.io")).toBe("Other");
    expect(sourceKind("next.dev.example.org")).toBe("Other");
  });
});

describe("articleVerdict", () => {
  it("refuses to judge small numbers", () => {
    expect(articleVerdict({ ...verdictInput, views: 5, stayedRate: 0, finishedRate: 0 }).label).toBe("Too little data");
    expect(articleVerdict(verdictInput).label).toBe("No traffic yet");
  });

  it("flags readers leaving fast before anything else", () => {
    const verdict = articleVerdict({ ...verdictInput, views: 50, stayedRate: 10, finishedRate: 60, signups: 5 });
    expect(verdict).toMatchObject({ tone: "bad", label: "Readers leave fast" });
  });

  it("praises an article that brings subscribers", () => {
    expect(articleVerdict({ ...verdictInput, views: 100, stayedRate: 50, finishedRate: 20, signups: 3 }).label).toBe("Working");
  });

  it("points out readers who finish but do not sign up", () => {
    expect(articleVerdict({ ...verdictInput, views: 100, stayedRate: 50, finishedRate: 45 }).label).toBe("Read, no sign-ups");
  });

  it("flags readers who stop early", () => {
    expect(articleVerdict({ ...verdictInput, views: 100, stayedRate: 50, finishedRate: 10 }).label).toBe("Readers stop early");
  });

  it("reads Google signals when there are too few visits", () => {
    const google = { ...verdictInput, impressions: 100 };
    expect(articleVerdict({ ...google, position: 5, ctr: 1 }).label).toBe("Seen, not clicked");
    expect(articleVerdict({ ...google, position: 5, ctr: 8 }).label).toBe("Strong in Google");
    expect(articleVerdict({ ...google, position: 15, ctr: 0 }).label).toBe("Almost page 1");
    const low = articleVerdict({ ...google, position: 32.4, ctr: 0 });
    expect(low.label).toBe("Ranks low");
    expect(low.advice).toContain("position 32");
  });
});

describe("buildReport", () => {
  const today = "2026-10-30";
  const posts: PostInfo[] = [
    { title: "Post A", slug: "a", publishedAt: "2026-10-01", category: "Web" },
    { title: "Post B", slug: "b", publishedAt: "2026-10-02", category: null },
  ];
  const counter = (day: string, metric: string, key: string, value: number): CounterRow => ({ day, metric, key, value });
  const stat = (day: string, kind: SearchRow["kind"], key: string, clicks: number, impressions: number, position: number): SearchRow => ({
    day,
    kind,
    key,
    clicks,
    impressions,
    position,
  });

  const counters: CounterRow[] = [
    counter(today, "entry", "/blog/a", 2),
    counter(today, "view", "/blog/a", 3),
    counter(today, "view", "/", 1),
    counter(today, "view", "/blog/category/*", 4),
    counter(today, "engaged", "/blog/a", 1),
    counter(today, "read90", "/blog/a", 1),
    counter(today, "seconds", "/blog/a", 90),
    counter(today, "signup", "/blog/a", 1),
    counter(today, "confirmed", "", 1),
    counter(today, "source", "google.com", 1),
    counter(today, "source", "direct", 1),
    counter("2026-10-29", "entry", "/", 1),
    // The week before the 7-day window: comparison only.
    counter("2026-10-20", "entry", "/", 4),
    // Older than both windows: must not appear anywhere.
    counter("2026-09-01", "entry", "/", 99),
  ];
  const search: SearchRow[] = [
    stat("2026-10-27", "total", "", 1, 100, 20),
    stat("2026-10-26", "total", "", 0, 100, 10),
    stat("2026-10-27", "page", "/blog/a", 1, 100, 15),
    stat("2026-10-27", "query", "close phrase", 0, 8, 12),
    stat("2026-10-27", "query", "far phrase", 0, 50, 40),
    stat("2026-10-15", "total", "", 7, 70, 30),
  ];

  const report = buildReport({ days: 7, today, counters, search, posts, countingSince: "2026-09-01" });

  it("splits numbers into this period and the one before", () => {
    expect(report.current.visits).toBe(3);
    expect(report.previous.visits).toBe(4);
    expect(report.current.views).toBe(8);
  });

  it("counts only real articles as article views", () => {
    expect(report.current.articleViews).toBe(3);
  });

  it("anchors Google numbers on Google's newest day and weights position by impressions", () => {
    expect(report.searchThrough).toBe("2026-10-27");
    expect(report.searchAgeDays).toBe(3);
    expect(report.current.impressions).toBe(200);
    expect(report.current.clicks).toBe(1);
    expect(report.current.position).toBe(15);
    expect(report.previous.clicks).toBe(7);
  });

  it("builds a row for every article, including ones nobody read", () => {
    expect(report.articles.map((a) => a.slug)).toEqual(["a", "b"]);
    const [a, b] = report.articles;
    expect(a).toMatchObject({
      views: 3,
      stayedRate: 33,
      finishedRate: 33,
      avgSeconds: 30,
      signups: 1,
      impressions: 100,
      clicks: 1,
      ctr: 1,
    });
    expect(a.position).toBe(15);
    expect(b).toMatchObject({ views: 0, stayedRate: null, avgSeconds: null, position: null });
    expect(b.verdict.label).toBe("No traffic yet");
  });

  it("fills every day of the chart, including empty ones", () => {
    expect(report.dailyVisits).toHaveLength(7);
    expect(report.dailyVisits[0]).toEqual({ day: "2026-10-24", value: 0 });
    expect(report.dailyVisits.at(-1)).toEqual({ day: today, value: 2 });
    expect(report.dailyImpressions.at(-1)).toEqual({ day: "2026-10-27", value: 100 });
  });

  it("groups sources and keeps exact hosts", () => {
    expect(report.sources).toContainEqual({ label: "google.com", value: 1, tag: "Search" });
    expect(report.sourceKinds).toEqual(
      expect.arrayContaining([
        { label: "Search", value: 1 },
        { label: "Direct", value: 1 },
      ]),
    );
  });

  it("separates other pages from articles", () => {
    expect(report.otherPages.map((p) => p.label)).toEqual(["/blog/category/*", "/"]);
  });

  it("finds phrases close to page 1 and ignores far ones", () => {
    expect(report.almostPageOne.map((q) => q.query)).toEqual(["close phrase"]);
    expect(report.queries[0].query).toBe("far phrase");
  });

  it("offers the next steps from verdicts and phrases", () => {
    const labels = report.insights.map((i) => i.label);
    expect(labels).toContain('Close to page 1 for "close phrase"');
    expect(labels.some((label) => label.includes("Post A"))).toBe(true);
  });

  it("says nothing when there is no data", () => {
    const empty = buildReport({ days: 30, today, counters: [], search: [], posts: [], countingSince: null });
    expect(empty.current.visits).toBe(0);
    expect(empty.current.position).toBeNull();
    expect(empty.searchThrough).toBeNull();
    expect(empty.insights).toEqual([]);
    expect(empty.dailyVisits).toHaveLength(30);
  });
});
