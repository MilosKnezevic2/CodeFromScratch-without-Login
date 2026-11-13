import { describe, expect, it } from "vitest";
import { AREAS, areaCounts, areaOfCategory, buildFront, isIndexableList, MIN_POSTS_TO_INDEX } from "./front";

const post = (slug: string, category: string) => ({ slug, title: slug, category: { title: category, slug: category } });

// Newest first, the way the front page gets them.
const POSTS = [
  post("lists", "web-fundamentals"),
  post("vibe", "ai-and-machine-learning"),
  post("flexbox", "web-fundamentals"),
  post("login", "security"),
  post("courses", "developer-experience-and-career"),
  post("fullstack", "web-development"),
  post("prisma-drizzle", "databases"),
  post("stripe", "apis-and-integrations"),
  post("logging", "devops-and-infrastructure"),
  post("shipping", "cloud-and-hosting"),
  post("rsc", "javascript-frameworks"),
  post("grid", "web-fundamentals"),
  post("testing", "testing"),
];

describe("areas", () => {
  it("place every category in at most one area", () => {
    const all = AREAS.flatMap((a) => a.categories);
    expect(new Set(all).size).toBe(all.length);
    expect(areaOfCategory("security")?.slug).toBe("production");
    expect(areaOfCategory("unknown")).toBeUndefined();
  });

  it("count articles per area", () => {
    expect(Object.fromEntries(areaCounts(POSTS))).toEqual({ frontend: 5, "backend-and-data": 4, production: 3, career: 1 });
  });
});

describe("buildFront", () => {
  it("leads with the newest three and fills each area with newer articles not shown above", () => {
    const front = buildFront(POSTS, []);
    expect(front.lead?.slug).toBe("lists");
    expect(front.second.map((p) => p.slug)).toEqual(["vibe", "flexbox"]);
    expect(front.sections.map((s) => [s.area.slug, s.items.map((p) => p.slug), s.total])).toEqual([
      ["frontend", ["rsc", "grid", "testing"], 5],
      ["backend-and-data", ["fullstack", "prisma-drizzle", "stripe"], 4],
      ["production", ["login", "logging", "shipping"], 3],
    ]);
  });

  it("follows the view counts for Most read and tops it up with articles not on the page", () => {
    const front = buildFront(POSTS, ["shipping", "gone", "lists"]);
    expect(front.popular.map((p) => p.slug)).toEqual(["shipping", "lists", "courses"]);
  });

  it("copes with an empty journal", () => {
    expect(buildFront([], [])).toEqual({ lead: null, second: [], sections: [], popular: [] });
  });
});

describe("isIndexableList", () => {
  // Regression: on 2026-11-13 two categories with 1-2 posts carried noindex
  // but the sitemap still listed them (it only dropped empty ones).
  it("treats one or two articles as thin and three as indexable", () => {
    expect(isIndexableList(0)).toBe(false);
    expect(isIndexableList(1)).toBe(false);
    expect(isIndexableList(2)).toBe(false);
    expect(isIndexableList(MIN_POSTS_TO_INDEX)).toBe(true);
    expect(MIN_POSTS_TO_INDEX).toBe(3);
  });
});
