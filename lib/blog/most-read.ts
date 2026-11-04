import { prisma } from "@/lib/prisma";

/**
 * Article slugs by views over the last `days`, most first, from the site's
 * own daily counters. The journal must render with the database asleep, so
 * any failure means an empty list and the page fills the slot otherwise.
 */
export async function mostReadSlugs(days = 30, limit = 10): Promise<string[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  try {
    const rows = await prisma.analyticsCounter.groupBy({
      by: ["key"],
      where: { metric: "view", day: { gte: since }, key: { startsWith: "/blog/" } },
      _sum: { value: true },
      orderBy: { _sum: { value: "desc" } },
      take: limit + 5,
    });
    return rows
      .map((r) => r.key.slice("/blog/".length))
      .filter((slug) => /^[a-z0-9-]+$/.test(slug))
      .slice(0, limit);
  } catch (error) {
    console.error("Most read could not be loaded:", error);
    return [];
  }
}
