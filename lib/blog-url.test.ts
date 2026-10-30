import { describe, expect, it } from "vitest";
import { EMPTY_QUERY, legacyBlogRedirect, listingHref, parsePage, queryFromParams, withOverrides } from "./blog-url";

describe("parsePage", () => {
  it("accepts positive whole numbers only", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage("12")).toBe(12);
    for (const bad of ["0", "-1", "1.5", "abc", "", undefined, null, "01", "99999"]) expect(parsePage(bad)).toBeNull();
  });
});

describe("listingHref", () => {
  it("keeps the plain journal on static addresses", () => {
    expect(listingHref(EMPTY_QUERY)).toBe("/blog");
    expect(listingHref(EMPTY_QUERY, { page: "3" })).toBe("/blog/page/3");
    expect(listingHref({ ...EMPTY_QUERY, page: 4 }, { page: null })).toBe("/blog");
  });

  it("sends every filtered or sorted view to the search route", () => {
    expect(listingHref(EMPTY_QUERY, { q: "stripe" })).toBe("/blog/search?q=stripe");
    expect(listingHref(EMPTY_QUERY, { category: "databases", page: "2" })).toBe("/blog/search?category=databases&page=2");
    expect(listingHref(EMPTY_QUERY, { sort: "oldest" })).toBe("/blog/search?sort=oldest");
    expect(listingHref({ ...EMPTY_QUERY, q: "a b", page: 2 }, { tag: "nextjs" })).toBe("/blog/search?q=a+b&tag=nextjs&page=2");
  });

  it("sends a lone category or tag to its own page", () => {
    expect(listingHref(EMPTY_QUERY, { category: "databases" })).toBe("/blog/category/databases");
    expect(listingHref({ ...EMPTY_QUERY, category: "databases", tag: "nextjs" }, { tag: null })).toBe("/blog/category/databases");
    expect(listingHref(EMPTY_QUERY, { tag: "next.js" })).toBe("/blog/tag/next.js");
  });

  it("returns to the static journal when the last filter is removed", () => {
    expect(listingHref({ ...EMPTY_QUERY, category: "databases", page: 2 }, { category: null, page: null })).toBe("/blog");
    expect(listingHref({ ...EMPTY_QUERY, sort: "oldest" }, { sort: null })).toBe("/blog");
  });

  it("drops a nonsense page number instead of keeping it", () => {
    expect(withOverrides(EMPTY_QUERY, { page: "abc" }).page).toBe(1);
  });
});

describe("queryFromParams", () => {
  it("reads and trims the query string", () => {
    const query = queryFromParams(new URLSearchParams("q=+hello+&page=2&sort=oldest&category=x"));
    expect(query).toEqual({ page: 2, category: "x", tag: "", q: "hello", sort: "oldest" });
  });

  it("ignores values it does not understand", () => {
    expect(queryFromParams({ page: "zero", sort: "random", q: ["first", "second"] })).toEqual({ ...EMPTY_QUERY, q: "first" });
  });
});

describe("legacyBlogRedirect", () => {
  const redirect = (qs: string) => legacyBlogRedirect(new URLSearchParams(qs));

  it("leaves addresses without listing parameters alone", () => {
    expect(redirect("")).toBeNull();
    expect(redirect("utm_source=newsletter")).toBeNull();
  });

  it("moves pagination to static pages", () => {
    expect(redirect("page=2")).toBe("/blog/page/2");
    expect(redirect("page=1")).toBe("/blog");
    expect(redirect("page=abc")).toBe("/blog");
  });

  it("sends a lone category or tag to its own page", () => {
    expect(redirect("category=databases")).toBe("/blog/category/databases");
    expect(redirect("tag=next.js")).toBe("/blog/tag/next.js");
  });

  it("sends searches, sorts and combinations to the search route", () => {
    expect(redirect("q=stripe")).toBe("/blog/search?q=stripe");
    expect(redirect("category=databases&page=2")).toBe("/blog/search?category=databases&page=2");
    expect(redirect("sort=oldest")).toBe("/blog/search?sort=oldest");
    expect(redirect("category=a&tag=b")).toBe("/blog/search?category=a&tag=b");
  });
});
