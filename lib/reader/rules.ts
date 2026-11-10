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

// ---------------------------------------------------------------------------
// The reading desk: weekly goal, streak, activity, topics, milestones, picks.
// Weeks run Monday to Sunday in UTC, the same for every reader.

export const GOAL_MIN = 1;
export const GOAL_MAX = 7;
export const NAME_MAX = 60;
export const ACTIVITY_WEEKS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** The colours a reader can give a folder; the key is what the database stores. */
export const FOLDER_COLORS = {
  teal: "#2dd4bf",
  amber: "#fbbf24",
  violet: "#a78bfa",
  sky: "#38bdf8",
  rose: "#fb7185",
  lime: "#a3e635",
} as const;
export type FolderColor = keyof typeof FOLDER_COLORS;

export function isFolderColor(value: unknown): value is FolderColor {
  return typeof value === "string" && Object.hasOwn(FOLDER_COLORS, value);
}

export function folderHex(value: string): string {
  return isFolderColor(value) ? FOLDER_COLORS[value] : FOLDER_COLORS.teal;
}

/** A new folder takes the first colour not used yet, so neighbours differ. */
export function nextFolderColor(used: string[]): FolderColor {
  const keys = Object.keys(FOLDER_COLORS) as FolderColor[];
  return keys.find((k) => !used.includes(k)) ?? keys[used.length % keys.length];
}

export function parseGoal(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= GOAL_MIN && n <= GOAL_MAX ? n : null;
}

export type DisplayName = { ok: true; name: string } | { ok: false; error: string };

export function parseDisplayName(input: unknown): DisplayName {
  if (typeof input !== "string") return { ok: false, error: "Write the name you want shown." };
  // Control and bidi characters could make a name next to a comment read as something else.
  const name = input.replace(/[\p{Cc}\p{Cf}]/gu, "").replace(/\s+/g, " ").trim();
  if (name.length < 2) return { ok: false, error: "Use at least 2 characters." };
  if (name.length > NAME_MAX) return { ok: false, error: `Keep it under ${NAME_MAX} characters.` };
  return { ok: true, name };
}

/** Monday 00:00 UTC of the week that holds `date`. */
export function weekStart(date: Date): Date {
  const d = utcDay(date);
  const sinceMonday = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - sinceMonday * DAY_MS);
}

/** Midnight UTC of the day that holds `date`: the key of a ReadingDay row. */
export function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export interface WeekProgress {
  /** Articles finished since Monday. */
  thisWeek: number;
  goal: number;
  reached: boolean;
  /** Weeks in a row with the goal reached; this week counts once reached and does not break the run before it. */
  streak: number;
  /** The last 8 weeks, oldest first, the current one last. */
  recent: { reached: boolean; current: boolean }[];
}

export function weekProgress(finishedAt: Date[], goal: number, now: Date): WeekProgress {
  const current = weekStart(now).getTime();
  const perWeek = new Map<number, number>();
  for (const at of finishedAt) {
    const key = weekStart(at).getTime();
    perWeek.set(key, (perWeek.get(key) ?? 0) + 1);
  }
  const reachedAt = (key: number) => (perWeek.get(key) ?? 0) >= goal;
  const thisWeek = perWeek.get(current) ?? 0;
  let streak = reachedAt(current) ? 1 : 0;
  for (let key = current - WEEK_MS; reachedAt(key); key -= WEEK_MS) streak++;
  const recent = Array.from({ length: 8 }, (_, i) => {
    const key = current - (7 - i) * WEEK_MS;
    return { reached: reachedAt(key), current: key === current };
  });
  return { thisWeek, goal, reached: thisWeek >= goal, streak, recent };
}

export interface ActivityCell {
  date: string;
  seconds: number;
  /** 0 = nothing, 1-4 = more minutes. */
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

/** Twelve weeks of days, Monday first, one column a week, ending with this week. */
export function activityGrid(days: { day: Date; seconds: number }[], now: Date, weeks = ACTIVITY_WEEKS): ActivityCell[] {
  const byDay = new Map(days.map((d) => [utcDay(d.day).getTime(), d.seconds]));
  const first = weekStart(now).getTime() - (weeks - 1) * WEEK_MS;
  const today = utcDay(now).getTime();
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const t = first + i * DAY_MS;
    const seconds = byDay.get(t) ?? 0;
    const minutes = seconds / 60;
    const level = (seconds <= 0 ? 0 : minutes < 5 ? 1 : minutes < 15 ? 2 : minutes < 30 ? 3 : 4) as ActivityCell["level"];
    return { date: new Date(t).toISOString().slice(0, 10), seconds, level, future: t > today };
  });
}

export interface DeskPost {
  slug: string;
  title: string;
  category?: string;
  readingTime?: number;
  publishedAt?: string;
}

export interface TopicProgress {
  name: string;
  read: number;
  total: number;
}

/** Read articles per topic: the furthest along first, then the bigger topics. */
export function topicProgress(posts: DeskPost[], readSlugs: ReadonlySet<string>): TopicProgress[] {
  const topics = new Map<string, TopicProgress>();
  for (const p of posts) {
    if (!p.category) continue;
    const t = topics.get(p.category) ?? { name: p.category, read: 0, total: 0 };
    t.total++;
    if (readSlugs.has(p.slug)) t.read++;
    topics.set(p.category, t);
  }
  return [...topics.values()].sort((a, b) => b.read / b.total - a.read / a.total || b.total - a.total || a.name.localeCompare(b.name));
}

export interface Milestone {
  label: string;
  mark: string;
  done: boolean;
}

const READ_MILESTONES = [1, 5, 10, 25, 50];

/** The milestones reached, the next one to aim for, and every finished topic. */
export function milestones(readCount: number, topics: TopicProgress[]): Milestone[] {
  const out: Milestone[] = [];
  for (const n of READ_MILESTONES) {
    const label = n === 1 ? "First article read" : `${n} articles read`;
    if (readCount >= n) {
      out.push({ label, mark: String(n), done: true });
    } else {
      out.push({ label: `${label} (${n - readCount} to go)`, mark: String(n), done: false });
      break;
    }
  }
  for (const t of topics) {
    if (t.total > 0 && t.read === t.total) out.push({ label: `Topic finished: ${t.name}`, mark: "✓", done: true });
  }
  return out;
}

export interface Pick {
  slug: string;
  reason: string;
  isNew: boolean;
}

/**
 * Up to `count` articles the reader has not opened or saved: first from the
 * topics they finished most in (naming an article they read there), then the
 * newest anywhere.
 */
export function pickForYou(
  posts: DeskPost[],
  opened: { postSlug: string; completedAt: Date | null; readAt: Date }[],
  savedSlugs: ReadonlySet<string>,
  lastSeen: Date | null,
  count = 3,
): Pick[] {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const openedSlugs = new Set(opened.map((h) => h.postSlug));
  const candidates = posts
    .filter((p) => !openedSlugs.has(p.slug) && !savedSlugs.has(p.slug))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  const isNew = (p: DeskPost) => Boolean(lastSeen && p.publishedAt && new Date(p.publishedAt) > lastSeen);

  const finished = opened.filter((h) => h.completedAt).sort((a, b) => b.readAt.getTime() - a.readAt.getTime());
  const topicScore = new Map<string, { n: number; example: string }>();
  for (const h of finished) {
    const post = bySlug.get(h.postSlug);
    if (!post?.category) continue;
    const t = topicScore.get(post.category);
    if (t) t.n++;
    else topicScore.set(post.category, { n: 1, example: post.title });
  }
  const topics = [...topicScore.entries()].sort((a, b) => b[1].n - a[1].n);

  const picks: Pick[] = [];
  const taken = new Set<string>();
  for (const [topic, { example }] of topics) {
    const next = candidates.find((p) => p.category === topic && !taken.has(p.slug));
    if (!next) continue;
    picks.push({ slug: next.slug, reason: `Because you read ${shortTitle(example)}`, isNew: isNew(next) });
    taken.add(next.slug);
    if (picks.length === count) return picks;
  }
  for (const p of candidates) {
    if (picks.length === count) break;
    if (taken.has(p.slug)) continue;
    picks.push({ slug: p.slug, reason: isNew(p) ? "New since your last visit" : "Recently published", isNew: isNew(p) });
    taken.add(p.slug);
  }
  return picks;
}

/** "Prisma vs Drizzle: How to Choose…" → "Prisma vs Drizzle". */
export function shortTitle(title: string): string {
  const head = title.split(/[:?]/)[0].trim();
  return head.length > 0 && head.length <= 48 ? head : `${title.slice(0, 45).trimEnd()}…`;
}

/** Minutes still to read from this point of an article, at least one. */
export function minutesLeft(readingTime: number | undefined, percent: number): number | null {
  if (!readingTime || readingTime <= 0) return null;
  return Math.max(1, Math.round(readingTime * (1 - Math.min(100, Math.max(0, percent)) / 100)));
}
