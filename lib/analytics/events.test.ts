import { describe, expect, it } from "vitest";
import {
  classifyPath,
  cleanHost,
  countersFor,
  countryFrom,
  dayKey,
  deviceFrom,
  isBot,
  MAX_SECONDS_PER_EVENT,
  MAX_BATCH,
  mergeCounters,
  parseEvent,
  parseEvents,
  type CountContext,
} from "./events";

const context: CountContext = { country: "AT", device: "mobile", slugs: new Set(["real-post"]) };

describe("parseEvent", () => {
  it("rejects anything that is not a known event", () => {
    for (const body of [null, 1, "x", {}, { type: "view" }, { type: "nope", path: "/" }, { type: "view", path: "no-slash" }]) {
      expect(parseEvent(body)).toBeNull();
    }
    expect(parseEvent({ type: "view", path: `/${"a".repeat(300)}` })).toBeNull();
    expect(parseEvent({ type: "milestone", path: "/", name: "hacked" })).toBeNull();
    expect(parseEvent({ type: "goal", path: "/", name: "purchase" })).toBeNull();
  });

  it("treats entry as true only for a real true", () => {
    expect(parseEvent({ type: "view", path: "/", entry: "yes" })).toMatchObject({ entry: false });
    expect(parseEvent({ type: "view", path: "/", entry: true })).toMatchObject({ entry: true });
  });

  it("caps reading time and drops nonsense values", () => {
    expect(parseEvent({ type: "time", path: "/", seconds: 99999 })).toMatchObject({ seconds: MAX_SECONDS_PER_EVENT });
    expect(parseEvent({ type: "time", path: "/", seconds: 0 })).toBeNull();
    expect(parseEvent({ type: "time", path: "/", seconds: -5 })).toBeNull();
    expect(parseEvent({ type: "time", path: "/", seconds: Number.NaN })).toBeNull();
    expect(parseEvent({ type: "time", path: "/", seconds: "10" })).toBeNull();
  });
});

describe("parseEvents", () => {
  const view = { type: "view", path: "/", entry: false, referrer: null };

  it("reads one event, a bare array, or a wrapped array", () => {
    expect(parseEvents(view)).toHaveLength(1);
    expect(parseEvents([view, { type: "milestone", path: "/", name: "read50" }])).toHaveLength(2);
    expect(parseEvents({ events: [view] })).toHaveLength(1);
  });

  it("drops the broken entries and keeps the rest", () => {
    expect(parseEvents([view, { type: "nope" }, null, 7])).toHaveLength(1);
    expect(parseEvents({ events: "x" })).toHaveLength(0);
  });

  it("caps a batch", () => {
    expect(parseEvents(Array.from({ length: MAX_BATCH + 5 }, () => view))).toHaveLength(MAX_BATCH);
  });
});

describe("mergeCounters", () => {
  it("adds up counters for the same metric and key, keeping order", () => {
    expect(
      mergeCounters([
        { metric: "view", key: "/", value: 1 },
        { metric: "seconds", key: "/", value: 30 },
        { metric: "view", key: "/", value: 1 },
        { metric: "seconds", key: "/", value: 12 },
      ]),
    ).toEqual([
      { metric: "view", key: "/", value: 2 },
      { metric: "seconds", key: "/", value: 42 },
    ]);
  });
});

describe("classifyPath", () => {
  const slugs = new Set(["real-post"]);

  it("keeps known pages and normalises their form", () => {
    expect(classifyPath("/", slugs)).toEqual({ kind: "known", key: "/" });
    expect(classifyPath("/blog/", slugs)).toEqual({ kind: "known", key: "/blog" });
    expect(classifyPath("/blog/REAL-post", slugs)).toEqual({ kind: "known", key: "/blog/real-post" });
  });

  it("folds category and tag pages so their number of keys stays fixed", () => {
    expect(classifyPath("/blog/category/anything", slugs)).toEqual({ kind: "known", key: "/blog/category/*" });
    expect(classifyPath("/blog/tag/anything", slugs)).toEqual({ kind: "known", key: "/blog/tag/*" });
  });

  it("calls an unknown address missing and never stores it", () => {
    expect(classifyPath("/blog/not-a-post", slugs)).toEqual({ kind: "missing" });
    expect(classifyPath("/wp-admin", slugs)).toEqual({ kind: "missing" });
  });

  it("ignores private and parked areas", () => {
    for (const path of ["/portal-cfs-admin", "/portal-cfs-admin/users", "/dashboard/x", "/login", "/pricing", "/newsletter/confirm"]) {
      expect(classifyPath(path, slugs)).toEqual({ kind: "ignored" });
    }
  });

  it("drops article paths when the article list is unavailable, not mislabels them", () => {
    expect(classifyPath("/blog/real-post", null)).toEqual({ kind: "ignored" });
    expect(classifyPath("/", null)).toEqual({ kind: "known", key: "/" });
  });
});

describe("cleanHost", () => {
  it("accepts plain hosts and strips www", () => {
    expect(cleanHost("www.Google.com")).toBe("google.com");
    expect(cleanHost("news.ycombinator.com")).toBe("news.ycombinator.com");
  });

  it("rejects values that are not hosts", () => {
    for (const value of [null, "", "localhost", "<script>", "a b.com", "https://x.com/path", `${"a".repeat(120)}.com`]) {
      expect(cleanHost(value)).toBeNull();
    }
  });
});

describe("countersFor", () => {
  it("counts a landing with its source, device and country", () => {
    const counters = countersFor({ type: "view", path: "/blog/real-post", entry: true, referrer: "www.google.com" }, context);
    expect(counters).toEqual([
      { metric: "view", key: "/blog/real-post", value: 1 },
      { metric: "entry", key: "/blog/real-post", value: 1 },
      { metric: "source", key: "google.com", value: 1 },
      { metric: "device", key: "mobile", value: 1 },
      { metric: "country", key: "AT", value: 1 },
    ]);
  });

  it("counts a click inside the site as a view only", () => {
    expect(countersFor({ type: "view", path: "/", entry: false, referrer: null }, context)).toEqual([
      { metric: "view", key: "/", value: 1 },
    ]);
  });

  it("uses direct when the referrer is empty or invalid", () => {
    const sourceOf = (referrer: string | null) =>
      countersFor({ type: "view", path: "/", entry: true, referrer }, context).find((c) => c.metric === "source")?.key;
    expect(sourceOf(null)).toBe("direct");
    expect(sourceOf("not a host")).toBe("direct");
  });

  it("omits the country when it is not known", () => {
    const counters = countersFor({ type: "view", path: "/", entry: true, referrer: null }, { ...context, country: null });
    expect(counters.some((c) => c.metric === "country")).toBe(false);
  });

  it("records a missing page without its address, and nothing else for it", () => {
    expect(countersFor({ type: "view", path: "/wp-login.php", entry: true, referrer: null }, context)).toEqual([
      { metric: "notfound", key: "", value: 1 },
    ]);
    expect(countersFor({ type: "goal", path: "/nope", name: "signup" }, context)).toEqual([]);
    expect(countersFor({ type: "time", path: "/nope", seconds: 10 }, context)).toEqual([]);
  });

  it("never records private areas", () => {
    expect(countersFor({ type: "view", path: "/portal-cfs-admin", entry: true, referrer: null }, context)).toEqual([]);
  });

  it("counts reading progress and goals against the page", () => {
    expect(countersFor({ type: "milestone", path: "/blog/real-post", name: "read90" }, context)).toEqual([
      { metric: "read90", key: "/blog/real-post", value: 1 },
    ]);
    expect(countersFor({ type: "time", path: "/", seconds: 42 }, context)).toEqual([
      { metric: "seconds", key: "/", value: 42 },
    ]);
    expect(countersFor({ type: "goal", path: "/newsletter", name: "signup" }, context)).toEqual([
      { metric: "signup", key: "/newsletter", value: 1 },
    ]);
  });
});

describe("request signals", () => {
  it("recognises bots and empty user agents", () => {
    for (const ua of [
      null,
      "",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0 Safari/537.36",
      "Mozilla/5.0 Chrome/120 Chrome-Lighthouse",
      "curl/8.0",
    ]) {
      expect(isBot(ua)).toBe(true);
    }
  });

  it("lets real browsers through", () => {
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36")).toBe(false);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")).toBe(false);
  });

  it("sorts devices", () => {
    expect(deviceFrom("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(deviceFrom("Mozilla/5.0 (Linux; Android 14) Mobile")).toBe("mobile");
    expect(deviceFrom("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceFrom("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");
  });

  it("accepts only a two-letter country code", () => {
    expect(countryFrom("AT")).toBe("AT");
    expect(countryFrom(null)).toBeNull();
    expect(countryFrom("at")).toBeNull();
    expect(countryFrom("Austria")).toBeNull();
  });

  it("uses the calendar day in Austria, not UTC", () => {
    expect(dayKey(new Date("2026-10-30T23:30:00Z"))).toBe("2026-10-31");
    expect(dayKey(new Date("2026-07-01T21:59:00Z"))).toBe("2026-07-01");
    expect(dayKey(new Date("2026-07-01T22:01:00Z"))).toBe("2026-07-02");
  });
});
