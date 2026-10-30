/**
 * What the site counts, and the rules that turn one browser event into daily
 * totals. Everything here is pure so it can be tested without a request.
 *
 * Privacy by construction: the output is only (day, metric, key, +n). Nothing
 * links two events, no IP address or identifier is stored, and a country or
 * device is never stored next to a page.
 */

export type GoalName = "signup" | "waitlist" | "share";
export type MilestoneName = "read50" | "read90" | "engaged";

export type CollectEvent =
  | { type: "view"; path: string; entry: boolean; referrer: string | null }
  | { type: "milestone"; path: string; name: MilestoneName }
  | { type: "time"; path: string; seconds: number }
  | { type: "goal"; path: string; name: GoalName };

export interface Counter {
  metric: string;
  key: string;
  value: number;
}

export interface CountContext {
  country: string | null;
  device: Device;
  /** Published article slugs; null when they could not be loaded. */
  slugs: ReadonlySet<string> | null;
}

export type Device = "mobile" | "tablet" | "desktop";

const MILESTONES: readonly string[] = ["read50", "read90", "engaged"];
const GOALS: readonly string[] = ["signup", "waitlist", "share"];
const MAX_PATH = 200;
const MAX_HOST = 100;
export const MAX_SECONDS_PER_EVENT = 600;

/** Public pages that have a fixed address. Everything else is an article or unknown. */
const STATIC_PATHS = new Set([
  "/",
  "/blog",
  "/newsletter",
  "/contact",
  "/course-waitlist",
  "/production-checklist",
  "/privacy",
  "/terms",
  "/impressum",
]);

/** Parked or private areas: not public traffic, and not a missing page either. */
const IGNORED_PREFIXES = [
  "/portal-cfs-admin",
  "/dashboard",
  "/api",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/checkout",
  "/courses",
  "/ebooks",
  "/donate",
  "/onboarding",
  "/newsletter/confirm",
  "/newsletter/unsubscribe",
];

const isPath = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("/") && value.length <= MAX_PATH;

/** Reads an untrusted request body. Returns null for anything malformed. */
export function parseEvent(body: unknown): CollectEvent | null {
  if (!body || typeof body !== "object") return null;
  const event = body as Record<string, unknown>;
  if (!isPath(event.path)) return null;
  const path = event.path;

  switch (event.type) {
    case "view":
      return {
        type: "view",
        path,
        entry: event.entry === true,
        referrer: typeof event.referrer === "string" ? event.referrer : null,
      };
    case "milestone":
      return typeof event.name === "string" && MILESTONES.includes(event.name)
        ? { type: "milestone", path, name: event.name as MilestoneName }
        : null;
    case "time": {
      if (typeof event.seconds !== "number" || !Number.isFinite(event.seconds)) return null;
      const seconds = Math.min(Math.round(event.seconds), MAX_SECONDS_PER_EVENT);
      return seconds >= 1 ? { type: "time", path, seconds } : null;
    }
    case "goal":
      return typeof event.name === "string" && GOALS.includes(event.name)
        ? { type: "goal", path, name: event.name as GoalName }
        : null;
    default:
      return null;
  }
}

export type PathClass = { kind: "known"; key: string } | { kind: "missing" } | { kind: "ignored" };

/**
 * Sorts a path into a stored key. Keys come from a closed set, so nobody can
 * fill the table by posting made-up addresses. Category and tag pages are
 * folded together for the same reason.
 */
export function classifyPath(rawPath: string, slugs: ReadonlySet<string> | null): PathClass {
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, "").toLowerCase() : rawPath;
  if (IGNORED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return { kind: "ignored" };
  }
  if (STATIC_PATHS.has(path)) return { kind: "known", key: path };
  if (path.startsWith("/blog/category/")) return { kind: "known", key: "/blog/category/*" };
  if (path.startsWith("/blog/tag/")) return { kind: "known", key: "/blog/tag/*" };

  const article = /^\/blog\/([a-z0-9-]+)$/.exec(path);
  if (article) {
    // Without the article list we cannot tell an article from a typo, so the
    // event is dropped rather than recorded under the wrong heading.
    if (!slugs) return { kind: "ignored" };
    if (slugs.has(article[1])) return { kind: "known", key: path };
  }
  return { kind: "missing" };
}

/** Lowercase host without "www.", or null when the value is not a plain host name. */
export function cleanHost(referrer: string | null): string | null {
  if (!referrer) return null;
  const host = referrer.trim().toLowerCase().replace(/^www\./, "");
  if (host.length > MAX_HOST || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null;
  return host;
}

export function countersFor(event: CollectEvent, context: CountContext): Counter[] {
  const target = classifyPath(event.path, context.slugs);
  if (target.kind === "ignored") return [];
  if (target.kind === "missing") {
    return event.type === "view" ? [{ metric: "notfound", key: "", value: 1 }] : [];
  }

  const { key } = target;
  switch (event.type) {
    case "view": {
      const counters: Counter[] = [{ metric: "view", key, value: 1 }];
      if (event.entry) {
        counters.push(
          { metric: "entry", key, value: 1 },
          { metric: "source", key: cleanHost(event.referrer) ?? "direct", value: 1 },
          { metric: "device", key: context.device, value: 1 },
        );
        if (context.country) counters.push({ metric: "country", key: context.country, value: 1 });
      }
      return counters;
    }
    case "milestone":
      return [{ metric: event.name, key, value: 1 }];
    case "time":
      return [{ metric: "seconds", key, value: event.seconds }];
    case "goal":
      return [{ metric: event.name, key, value: 1 }];
  }
}

const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|lighthouse|pagespeed|headless|phantom|puppeteer|playwright|curl|wget|python|node-fetch|axios|go-http|java\//i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function deviceFrom(userAgent: string): Device {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

export function countryFrom(header: string | null): string | null {
  return header && /^[A-Z]{2}$/.test(header) ? header : null;
}

/** The calendar day in Austria, so a day means the same here as on the clock in Graz. */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
