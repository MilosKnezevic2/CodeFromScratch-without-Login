import { describe, expect, it } from "vitest";
import {
  formatDuration,
  MAX_SECONDS_PER_REPORT,
  parseFolderName,
  parseProgress,
  readingStats,
  shouldOfferResume,
} from "./rules";

describe("parseProgress", () => {
  it("clamps and rounds", () => {
    expect(parseProgress({ slug: "zod", percent: 140.4, seconds: 999 })).toEqual({ slug: "zod", percent: 100, seconds: MAX_SECONDS_PER_REPORT });
    expect(parseProgress({ slug: "zod", percent: -3, seconds: -1 })).toEqual({ slug: "zod", percent: 0, seconds: 0 });
  });

  it("refuses nonsense", () => {
    expect(parseProgress(null)).toBeNull();
    expect(parseProgress({ slug: "../x", percent: 1 })).toBeNull();
    expect(parseProgress({ slug: "zod", percent: "lots" })).toBeNull();
  });
});

describe("parseFolderName", () => {
  it("tidies whitespace and refuses empty or long names", () => {
    expect(parseFolderName("  To   read  later ")).toEqual({ ok: true, name: "To read later" });
    expect(parseFolderName("   ").ok).toBe(false);
    expect(parseFolderName("x".repeat(61)).ok).toBe(false);
    expect(parseFolderName(7).ok).toBe(false);
  });
});

describe("readingStats", () => {
  const live = new Set(["a", "b", "c", "d"]);
  it("counts finished articles against everything published", () => {
    const stats = readingStats(
      [
        { postSlug: "a", scrollPercent: 100, secondsRead: 300, completedAt: new Date() },
        { postSlug: "b", scrollPercent: 92, secondsRead: 120, completedAt: null },
        { postSlug: "c", scrollPercent: 40, secondsRead: 60, completedAt: null },
        { postSlug: "gone", scrollPercent: 100, secondsRead: 30, completedAt: new Date() },
      ],
      live,
    );
    expect(stats).toEqual({ read: 2, started: 1, total: 4, percentOfSite: 50, seconds: 510 });
  });

  it("copes with an empty site", () => {
    expect(readingStats([], new Set()).percentOfSite).toBe(0);
  });
});

describe("helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(20)).toBe("under a minute");
    expect(formatDuration(12 * 60)).toBe("12 min");
    expect(formatDuration(65 * 60)).toBe("1 h 5 min");
    expect(formatDuration(120 * 60)).toBe("2 h");
  });

  it("offers resume only mid-article", () => {
    expect(shouldOfferResume(2)).toBe(false);
    expect(shouldOfferResume(42)).toBe(true);
    expect(shouldOfferResume(95)).toBe(false);
  });
});
