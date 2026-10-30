/**
 * Where every listing state lives, so that /blog itself can be static.
 *
 * - The plain journal is /blog (page 1) and /blog/page/N: prerendered, cached
 *   at the edge, no server work per visit.
 * - Anything that is a view of the same articles (a search, a filter on the
 *   index, a re-sort) is /blog/search?... : rendered per request and kept out
 *   of the index, because every combination is a thin copy of a static page.
 * - A category or tag on its own has a real page already: /blog/category/x
 *   and /blog/tag/x.
 *
 * Pure, so the rules are tested without a browser.
 */

export type ListingSort = "newest" | "oldest";

export interface ListingQuery {
  page: number;
  category: string;
  tag: string;
  q: string;
  sort: ListingSort;
}

export const BLOG_PAGE_SIZE = 12;
export const MAX_PAGE = 10_000;

export const EMPTY_QUERY: ListingQuery = { page: 1, category: "", tag: "", q: "", sort: "newest" };

export type Overrides = Partial<Record<"page" | "category" | "tag" | "q" | "sort", string | null>>;

/** A positive page number from a route or query value, or null when it is not one. */
export function parsePage(value: string | undefined | null): number | null {
  if (!value || !/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page <= MAX_PAGE ? page : null;
}

function isPlain(query: ListingQuery): boolean {
  return !query.q && !query.category && !query.tag && query.sort === "newest";
}

/** Applies overrides the way the old query-string links did: null removes a key. */
export function withOverrides(base: ListingQuery, overrides: Overrides): ListingQuery {
  const next: ListingQuery = { ...base };
  for (const [key, value] of Object.entries(overrides) as [keyof Overrides, string | null | undefined][]) {
    if (value === undefined) continue;
    if (key === "page") next.page = value === null ? 1 : (parsePage(value) ?? 1);
    else if (key === "sort") next.sort = value === "oldest" ? "oldest" : "newest";
    else next[key] = value ?? "";
  }
  return next;
}

/**
 * The address for a listing state. Plain states are static pages, a lone
 * category or tag is its own page, and the rest is the search route.
 */
export function listingHref(base: ListingQuery, overrides: Overrides = {}): string {
  const query = withOverrides(base, overrides);
  if (isPlain(query)) return query.page > 1 ? `/blog/page/${query.page}` : "/blog";
  const single = !query.q && query.sort === "newest" && query.page === 1;
  if (single && query.category && !query.tag) return `/blog/category/${encodeURIComponent(query.category)}`;
  if (single && query.tag && !query.category) return `/blog/tag/${encodeURIComponent(query.tag)}`;
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.category) params.set("category", query.category);
  if (query.tag) params.set("tag", query.tag);
  if (query.sort === "oldest") params.set("sort", "oldest");
  if (query.page > 1) params.set("page", String(query.page));
  return `/blog/search?${params.toString()}`;
}

/** Reads the search route's query string into a listing state. */
export function queryFromParams(params: Record<string, string | string[] | undefined> | URLSearchParams): ListingQuery {
  const get = (key: string): string => {
    const raw = params instanceof URLSearchParams ? params.get(key) : params[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return typeof value === "string" ? value.trim().slice(0, 200) : "";
  };
  return {
    page: parsePage(get("page")) ?? 1,
    category: get("category"),
    tag: get("tag"),
    q: get("q"),
    sort: get("sort") === "oldest" ? "oldest" : "newest",
  };
}

/**
 * Where an old /blog?... address should go, or null when the query carries
 * nothing the listing understands (the static page then simply ignores it).
 */
export function legacyBlogRedirect(params: URLSearchParams): string | null {
  const known = ["page", "category", "tag", "q", "sort"].filter((key) => params.has(key));
  if (known.length === 0) return null;
  return listingHref(queryFromParams(params));
}
