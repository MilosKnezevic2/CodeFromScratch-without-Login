/**
 * Rules for a signed-in reader's library: reading progress, saved articles
 * and folders. Free of the database so they can be tested.
 */

/** A reading report covers at most this much time; anything above is a tab left open. */
export const MAX_SECONDS_PER_REPORT = 120;
/** At this point of an article it counts as read. */
export const READ_AT_PERCENT = 90;
export const MAX_FOLDERS = 30;
export const FOLDER_NAME_MAX = 60;
export const MAX_SAVED = 1000;

const SLUG_RE = /^[a-z0-9-]{1,200}$/;

export function isSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_RE.test(value);
}

export type Progress = { slug: string; percent: number; seconds: number };

/** Validates what the article page reports; out-of-range numbers are clamped, nonsense is refused. */
export function parseProgress(body: unknown): Progress | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!isSlug(b.slug)) return null;
  const percent = Number(b.percent);
  const seconds = Number(b.seconds ?? 0);
  if (!Number.isFinite(percent) || !Number.isFinite(seconds)) return null;
  return {
    slug: b.slug,
    percent: Math.min(100, Math.max(0, Math.round(percent))),
    seconds: Math.min(MAX_SECONDS_PER_REPORT, Math.max(0, Math.round(seconds))),
  };
}

export type FolderName = { ok: true; name: string } | { ok: false; error: string };

export function parseFolderName(input: unknown): FolderName {
  if (typeof input !== "string") return { ok: false, error: "Give the folder a name." };
  const name = input.replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, error: "Give the folder a name." };
  if (name.length > FOLDER_NAME_MAX) return { ok: false, error: `Keep it under ${FOLDER_NAME_MAX} characters.` };
  return { ok: true, name };
}

export interface HistoryRow {
  postSlug: string;
  scrollPercent: number;
  secondsRead: number;
  completedAt: Date | null;
}

export interface ReadingStats {
  read: number;
  started: number;
  total: number;
  /** Share of all published articles read to the end, 0-100. */
  percentOfSite: number;
  seconds: number;
}

/** Only articles that are still published count towards the share of the site. */
export function readingStats(history: HistoryRow[], publishedSlugs: ReadonlySet<string>): ReadingStats {
  const live = history.filter((h) => publishedSlugs.has(h.postSlug));
  const read = live.filter((h) => h.completedAt || h.scrollPercent >= READ_AT_PERCENT).length;
  const total = publishedSlugs.size;
  return {
    read,
    started: live.length - read,
    total,
    percentOfSite: total ? Math.round((read / total) * 100) : 0,
    seconds: history.reduce((sum, h) => sum + h.secondsRead, 0),
  };
}

/** "1 h 5 min", "12 min", "under a minute". */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return "under a minute";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Offer "continue where you left off" only between a real start and the end. */
export function shouldOfferResume(lastPercent: number): boolean {
  return lastPercent >= 5 && lastPercent < READ_AT_PERCENT;
}
