import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULTS, fromStored, SECTIONS, type Section, type Settings } from "./schema";

export const SETTINGS_TAG = "site-settings";

function fromRows(rows: { key: string; value: unknown }[]): Settings {
  const settings = {} as Settings;
  for (const section of SECTIONS) {
    const row = rows.find((r) => r.key === section);
    settings[section] = fromStored(section, row?.value ?? DEFAULTS[section]) as never;
  }
  return settings;
}

/** Throws when the database cannot be read, so a failed read is never cached. */
async function readSettings(): Promise<Settings> {
  return fromRows(await prisma.siteSetting.findMany());
}

/** The last successful read in this server instance, the fallback before the defaults. */
let lastGood: Settings | null = null;

/**
 * Reads every section straight from the database. Public pages must never fail
 * because Postgres is asleep, so an error means the last values this instance
 * read, or the defaults (the values the site shipped with) if it has none.
 */
export async function loadSettings(): Promise<Settings> {
  try {
    lastGood = await readSettings();
    return lastGood;
  } catch (error) {
    console.error("Settings could not be read, using the last known values or defaults:", error);
    return lastGood ?? fromRows([]);
  }
}

/**
 * The read for public pages and API routes: cached for a few minutes and
 * refreshed the moment something is saved, so a page never waits on Postgres
 * for a value that changes a few times a year. The cached function throws on
 * a failed read: caching the defaults instead once kept /login a 404 for every
 * visitor after a single database timeout (accounts default to off).
 */
const cachedSettings = unstable_cache(readSettings, [SETTINGS_TAG, "strict"], {
  tags: [SETTINGS_TAG],
  revalidate: 300,
});

export async function getSettings(): Promise<Settings> {
  try {
    lastGood = await cachedSettings();
    return lastGood;
  } catch {
    // A failed read, or no Next request (tests, scripts) and so no cache:
    // read directly, which degrades to the last known values or the defaults.
    return loadSettings();
  }
}

export async function saveSection<S extends Section>(section: S, value: Settings[S]): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: section },
    create: { key: section, value: value as object },
    update: { value: value as object },
  });
}

/** Clears the cached settings and every public page that renders them. */
export function revalidateSettings(): void {
  revalidateTag(SETTINGS_TAG, "max");
  revalidatePath("/", "layout");
}
