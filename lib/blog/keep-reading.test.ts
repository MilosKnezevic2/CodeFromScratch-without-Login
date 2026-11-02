import { describe, expect, it } from "vitest";
import { pickKeepReading, type ReadingCandidate } from "./keep-reading";

const web = { title: "Web Fundamentals", slug: { current: "web-fundamentals" } };
const security = { title: "Security", slug: { current: "security" } };
const tag = (s: string) => ({ slug: { current: s } });
const post = (id: string, cat: typeof web, tags: string[], publishedAt: string): ReadingCandidate => ({
  _id: id,
  title: id,
  slug: { current: id },
  publishedAt,
  categories: [cat],
  tags: tags.map(tag),
});

const current = { _id: "me", categories: [web], tags: [tag("css"), tag("layout")] };
const pool = [
  post("me", web, ["css"], "2026-11-02"),
  post("grid", web, ["css", "layout"], "2026-09-01"),
  post("flex", web, ["css"], "2026-10-01"),
  post("html", web, [], "2026-08-01"),
  post("auth", security, ["layout"], "2026-07-01"),
  post("zod", security, [], "2026-06-01"),
];

describe("pickKeepReading", () => {
  it("leads with shared tags in the same category, then the category, then one from elsewhere", () => {
    const picks = pickKeepReading(current, pool);
    expect(picks.map((p) => [p._id, p.reason])).toEqual([
      ["grid", "Same topic"],
      ["flex", "Same topic"],
      ["auth", "From Security"],
    ]);
  });

  it("never shows the article itself and keeps the picks deterministic", () => {
    const a = pickKeepReading(current, pool);
    const b = pickKeepReading(current, [...pool].reverse());
    expect(a.map((p) => p._id)).toEqual(b.map((p) => p._id));
    expect(a.some((p) => p._id === "me")).toBe(false);
  });

  it("fills from the category when nothing shares a tag, and from elsewhere when the category is thin", () => {
    const lonely = { _id: "me", categories: [security], tags: [] };
    const picks = pickKeepReading(lonely, pool);
    expect(picks.map((p) => [p._id, p.reason])).toEqual([
      ["auth", "More in Security"],
      ["zod", "More in Security"],
      ["flex", "From Web Fundamentals"],
    ]);
  });

  it("copes with no category and few candidates", () => {
    const picks = pickKeepReading({ _id: "me" }, pool.slice(0, 2));
    expect(picks).toHaveLength(1);
    expect(picks[0].reason).toBe("From Web Fundamentals");
  });
});
