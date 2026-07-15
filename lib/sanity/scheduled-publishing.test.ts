import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Scheduled publishing works by importing posts as status:"published" with a
 * FUTURE publishedAt, and every public query gating on `publishedAt <= now()`.
 * If any query keeps the bare status filter, scheduled posts leak early (a
 * future-dated post would jump straight to the top of the blog). This scans
 * the actual source so no current or future occurrence can drop the clause.
 */
const GUARDED_FILES = [
  "lib/sanity/queries.ts",
  "lib/sanity/discovery.ts",
  "lib/sanity/hero-stats.ts",
  "lib/sanity/home-stats.ts",
  "app/blog/rss.xml/route.ts",
  "app/blog/atom.xml/route.ts",
  "app/blog/feed.json/route.ts",
];

const SCHEDULING_CLAUSE = ' && (!defined(publishedAt) || publishedAt <= now())';

describe("scheduled publishing filter", () => {
  for (const file of GUARDED_FILES) {
    it(`every published-status filter in ${file} carries the publishedAt gate`, () => {
      const src = readFileSync(join(process.cwd(), file), "utf8");
      const occurrences = src.split('status == "published"').length - 1;
      const gated = src.split(`status == "published"${SCHEDULING_CLAUSE}`).length - 1;
      expect(occurrences).toBeGreaterThan(0);
      expect(gated).toBe(occurrences);
    });
  }
});
