import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULTS, fromStored, SECTIONS, type Section, type Settings } from "./schema";

export const SETTINGS_TAG = "site-settings";

/**
 * Reads every section straight from the database. Public pages must never fail
 * because Postgres is asleep, so any error means the defaults, which are the
 * values the site shipped with.
 */
export async function loadSettings(): Promise<Settings> {
  const settings = {} as Settings;
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await prisma.siteSetting.findMany();
  } catch (error) {
    console.error("Settings could not be read, using defaults:", error);
  }
  for (const section of SECTIONS) {
    const row = rows.find((r) => r.key === section);
    settings[section] = fromStored(section, row?.value ?? DEFAULTS[section]) as never;
  }
  return settings;
}

/**
 * The read for public pages and API routes: cached for a few minutes and
 * refreshed the moment something is saved, so a page never waits on Postgres
 * for a value that changes a few times a year.
 */
const cachedSettings = unstable_cache(loadSettings, [SETTINGS_TAG], {
  tags: [SETTINGS_TAG],
  revalidate: 300,
});

export async function getSettings(): Promise<Settings> {
  try {
    return await cachedSettings();
  } catch {
    // Outside a Next request (tests, scripts) there is no cache to use; the
    // direct read already degrades to the defaults when the database is away.
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
