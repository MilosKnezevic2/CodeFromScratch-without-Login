import { describe, expect, it } from "vitest";
import {
  activityGrid,
  milestones,
  minutesLeft,
  nextFolderColor,
  parseDisplayName,
  parseGoal,
  pickForYou,
  shortTitle,
  topicProgress,
  weekProgress,
  weekStart,
} from "./rules";

// Wednesday 2026-11-04, 18:00 UTC.
const NOW = new Date("2026-11-04T18:00:00Z");
const at = (iso: string) => new Date(iso);

describe("weekStart", () => {
  it("is Monday 00:00 UTC, also on a Sunday night", () => {
    expect(weekStart(NOW).toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(weekStart(at("2026-11-08T23:59:00Z")).toISOString()).toBe("2026-11-02T00:00:00.000Z");
    expect(weekStart(at("2026-11-09T00:00:00Z")).toISOString()).toBe("2026-11-09T00:00:00.000Z");
  });
});

describe("weekProgress", () => {
  it("counts this week and the run of reached weeks before it", () => {
    const finished = [
      at("2026-11-03T10:00:00Z"), // this week: 1 of 2
      at("2026-10-27T10:00:00Z"), at("2026-10-30T10:00:00Z"), // last week: reached
      at("2026-10-20T10:00:00Z"), at("2026-10-25T22:00:00Z"), // the week before: reached
      at("2026-10-14T10:00:00Z"), // three weeks back: 1 of 2, ends the run
    ];
    const p = weekProgress(finished, 2, NOW);
    expect(p).toMatchObject({ thisWeek: 1, goal: 2, reached: false, streak: 2 });
    expect(p.recent.map((w) => w.reached)).toEqual([false, false, false, false, false, true, true, false]);
    expect(p.recent.at(-1)?.current).toBe(true);
  });

  it("adds this week once the goal is reached", () => {
    const p = weekProgress([at("2026-11-02T08:00:00Z"), at("2026-10-28T08:00:00Z")], 1, NOW);
    expect(p).toMatchObject({ thisWeek: 1, reached: true, streak: 2 });
  });

  it("is zero with nothing read", () => {
    expect(weekProgress([], 3, NOW)).toMatchObject({ thisWeek: 0, streak: 0, reached: false });
  });
});

describe("activityGrid", () => {
  it("lays out 12 weeks of days, Monday first, with levels by minutes", () => {
    const cells = activityGrid(
      [
        { day: at("2026-11-02T00:00:00Z"), seconds: 120 },
        { day: at("2026-11-03T00:00:00Z"), seconds: 40 * 60 },
      ],
      NOW,
    );
    expect(cells).toHaveLength(84);
    expect(cells[0].date).toBe("2026-08-17");
    expect(cells[77]).toMatchObject({ date: "2026-11-02", level: 1, future: false });
    expect(cells[78]).toMatchObject({ date: "2026-11-03", level: 4 });
    expect(cells[80].future).toBe(true);
  });
});

const POSTS = [
  { slug: "a", title: "Prisma vs Drizzle: How to Choose", category: "Databases", readingTime: 11, publishedAt: "2026-09-01T00:00:00Z" },
  { slug: "b", title: "Neon vs Supabase", category: "Databases", readingTime: 12, publishedAt: "2026-09-10T00:00:00Z" },
  { slug: "c", title: "Login Form Validation", category: "Security", readingTime: 19, publishedAt: "2026-10-31T00:00:00Z" },
  { slug: "d", title: "What Is Vibe Coding?", category: "AI", readingTime: 22, publishedAt: "2026-11-02T00:00:00Z" },
  { slug: "e", title: "Zod at the Trust Boundary", category: "Security", readingTime: 12, publishedAt: "2026-08-01T00:00:00Z" },
];

describe("topicProgress and milestones", () => {
  it("orders topics by how far along they are and marks finished ones", () => {
    const topics = topicProgress(POSTS, new Set(["a", "b", "c"]));
    expect(topics.map((t) => `${t.name} ${t.read}/${t.total}`)).toEqual(["Databases 2/2", "Security 1/2", "AI 0/1"]);
    expect(milestones(3, topics)).toEqual([
      { label: "First article read", mark: "1", done: true },
      { label: "5 articles read (2 to go)", mark: "5", done: false },
      { label: "Topic finished: Databases", mark: "✓", done: true },
    ]);
  });
});

describe("pickForYou", () => {
  it("picks unopened, unsaved articles from the reader's topics first, then the newest", () => {
    const opened = [{ postSlug: "a", completedAt: at("2026-10-01T00:00:00Z"), readAt: at("2026-10-01T00:00:00Z") }];
    const picks = pickForYou(POSTS, opened, new Set(["c"]), at("2026-11-01T00:00:00Z"));
    expect(picks).toEqual([
      { slug: "b", reason: "Because you read Prisma vs Drizzle", isNew: false },
      { slug: "d", reason: "New since your last visit", isNew: true },
      { slug: "e", reason: "Recently published", isNew: false },
    ]);
  });
});

describe("small parsers", () => {
  it("accepts goals from 1 to 7 only", () => {
    expect(parseGoal("4")).toBe(4);
    expect(parseGoal(0)).toBeNull();
    expect(parseGoal(8)).toBeNull();
    expect(parseGoal("2.5")).toBeNull();
  });

  it("cleans a display name and strips invisible characters", () => {
    expect(parseDisplayName("  Milos‮  Knezevic ")).toEqual({ ok: true, name: "Milos Knezevic" });
    expect(parseDisplayName("x").ok).toBe(false);
    expect(parseDisplayName("y".repeat(61)).ok).toBe(false);
  });

  it("gives a new folder an unused colour", () => {
    expect(nextFolderColor([])).toBe("teal");
    expect(nextFolderColor(["teal", "amber"])).toBe("violet");
  });

  it("shortens titles and counts minutes left", () => {
    expect(shortTitle("Prisma vs Drizzle: How to Choose Your TypeScript ORM")).toBe("Prisma vs Drizzle");
    expect(minutesLeft(25, 64)).toBe(9);
    expect(minutesLeft(10, 99)).toBe(1);
    expect(minutesLeft(undefined, 10)).toBeNull();
  });
});
