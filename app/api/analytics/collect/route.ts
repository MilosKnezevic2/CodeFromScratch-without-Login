import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/admin-session";
import { countersFor, countryFrom, deviceFrom, isBot, parseEvent } from "@/lib/analytics/events";
import { incrementCounters, publishedSlugs } from "@/lib/analytics/store";
import { rateLimit } from "@/lib/rate-limit";

const MAX_BODY = 1024;
const IGNORED = () => new Response(null, { status: 204 });

/** Only the real site counts: preview deployments must not add to the totals. */
function isCanonicalHost(request: Request): boolean {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return false;
  return new URL(site).host === new URL(request.url).host;
}

/**
 * Receives one anonymous event from a page. Always answers 204: a visitor's
 * page has nothing to do with the answer, and telling apart "counted" from
 * "ignored" would only help someone probing the filters.
 */
export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent");
  if (isBot(userAgent) || !isCanonicalHost(request) || !request.headers.get("origin")) return IGNORED();

  // The address is used for this in-memory limit only and is never stored.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`analytics:${ip}`, 120, 60_000).success) return IGNORED();

  const store = await cookies();
  if (store.has("__prerender_bypass") || (await verifyAdminSession(store.get("cfs-admin-token")?.value))) {
    return IGNORED();
  }

  const text = await request.text();
  if (text.length === 0 || text.length > MAX_BODY) return IGNORED();

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return IGNORED();
  }
  const event = parseEvent(body);
  if (!event) return IGNORED();

  try {
    const counters = countersFor(event, {
      country: countryFrom(request.headers.get("x-vercel-ip-country")),
      device: deviceFrom(userAgent ?? ""),
      slugs: await publishedSlugs(),
    });
    await incrementCounters(counters);
  } catch (error) {
    // The database may be asleep; statistics are never worth an error for a reader.
    console.error("Analytics collect failed:", error);
  }
  return IGNORED();
}
