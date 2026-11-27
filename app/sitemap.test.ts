import { describe, it, expect, beforeEach, vi } from "vitest";

const queries = vi.hoisted(() => ({
  getAllPostSlugs: vi.fn(),
  getCategoriesWithCounts: vi.fn(),
  getFrontPosts: vi.fn(),
}));
vi.mock("@/lib/sanity/queries", () => queries);

import * as route from "./sitemap";

describe("sitemap.xml", () => {
  beforeEach(() => {
    queries.getAllPostSlugs.mockResolvedValue([
      { slug: { current: "dropdown-with-popover-attribute" }, publishedAt: "2026-11-25T19:14:48.748Z" },
    ]);
    queries.getCategoriesWithCounts.mockResolvedValue([]);
    queries.getFrontPosts.mockResolvedValue([]);
  });

  // 2026-11-23 to 11-27: with `revalidate`, Vercel served the build-time file
  // and two new posts never reached the sitemap. It must be rendered per request.
  it("is rendered on every request, not cached as a build-time file", () => {
    expect(route.dynamic).toBe("force-dynamic");
    expect("revalidate" in route).toBe(false);
  });

  it("lists a post the moment Sanity returns it", async () => {
    const urls = (await route.default()).map((e) => e.url);
    expect(urls).toContain("https://codefromscratch.org/blog/dropdown-with-popover-attribute");
  });

  it("still answers with the fixed pages when Sanity is unreachable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    queries.getAllPostSlugs.mockRejectedValue(new Error("down"));
    queries.getCategoriesWithCounts.mockRejectedValue(new Error("down"));
    queries.getFrontPosts.mockRejectedValue(new Error("down"));
    const urls = (await route.default()).map((e) => e.url);
    expect(urls).toContain("https://codefromscratch.org/blog");
    expect(urls.some((u) => u.includes("/blog/dropdown"))).toBe(false);
    expect(error).toHaveBeenCalledTimes(3);
    error.mockRestore();
  });
});
