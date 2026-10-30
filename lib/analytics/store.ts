import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import { dayKey, type Counter } from "./events";

/** Adds to the daily totals in one atomic statement, so parallel events cannot lose counts. */
export async function incrementCounters(counters: Counter[], date = new Date()): Promise<void> {
  if (counters.length === 0) return;
  const day = dayKey(date);
  const days = counters.map(() => day);
  const metrics = counters.map((c) => c.metric);
  const keys = counters.map((c) => c.key);
  const values = counters.map((c) => c.value);
  await prisma.$executeRaw`
    INSERT INTO "AnalyticsCounter" ("day", "metric", "key", "value")
    SELECT d::date, m, k, v
    FROM unnest(${days}::text[], ${metrics}::text[], ${keys}::text[], ${values}::int[]) AS t(d, m, k, v)
    ON CONFLICT ("day", "metric", "key")
    DO UPDATE SET "value" = "AnalyticsCounter"."value" + EXCLUDED."value"
  `;
}

/**
 * Counts a server-side event such as a confirmed sign-up. A failed count must
 * never fail the action being counted, so errors are logged and dropped.
 */
export async function countServerEvent(metric: "confirmed" | "unsubscribe"): Promise<void> {
  await incrementCounters([{ metric, key: "", value: 1 }]).catch((error: unknown) => {
    console.error(`Analytics count failed (${metric}):`, error);
  });
}

const SLUG_TTL_MS = 10 * 60 * 1000;
let slugCache: { slugs: ReadonlySet<string>; loadedAt: number } | null = null;

/**
 * Published article slugs, cached per server instance. A stale list is better
 * than none when Sanity hiccups; null means there has never been a list.
 */
export async function publishedSlugs(): Promise<ReadonlySet<string> | null> {
  if (slugCache && Date.now() - slugCache.loadedAt < SLUG_TTL_MS) return slugCache.slugs;
  try {
    const slugs = await client.fetch<string[]>(
      `*[_type == "post" && status == "published" && defined(slug.current)].slug.current`,
    );
    slugCache = { slugs: new Set(slugs), loadedAt: Date.now() };
    return slugCache.slugs;
  } catch (error) {
    console.error("Analytics could not load article slugs:", error);
    return slugCache?.slugs ?? null;
  }
}
