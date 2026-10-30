/**
 * Copies Search Console numbers into the database so the admin analytics page
 * can show them. Safe to run again: each day is overwritten with Google's
 * latest figures. Only aggregates are stored (Google anonymises rare phrases).
 *
 * The key stays on this computer on purpose, so this runs from a local
 * scheduled task and not on Vercel.
 *
 * Run: node scripts/gsc-sync.mjs [days=120]
 */

import "dotenv/config";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { gscApi } from "./lib/gsc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const days = Number(process.argv[2] ?? 120);
const ROW_LIMIT = 25000;
const MAX_KEY = 300;

const api = await gscApi(join(root, ".secrets", "gsc-key.json"));
const end = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const start = new Date(Date.now() - (days + 1) * 864e5).toISOString().slice(0, 10);

const query = async (dimensions) => {
  const body = await api("/searchAnalytics/query", {
    method: "POST",
    body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit: ROW_LIMIT, dataState: "all" }),
  });
  return body.rows ?? [];
};

const pagePath = (url) => {
  const path = new URL(url).pathname;
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
};

const [totals, pages, queries] = await Promise.all([
  query(["date"]),
  query(["date", "page"]),
  query(["date", "query"]),
]);

// Several URLs can fold into one path (a trailing slash, www), so merge before writing.
const merged = new Map();
const add = (day, kind, key, row) => {
  const id = `${day}|${kind}|${key}`;
  const entry = merged.get(id) ?? { day, kind, key, clicks: 0, impressions: 0, weighted: 0 };
  entry.clicks += row.clicks;
  entry.impressions += row.impressions;
  entry.weighted += row.position * row.impressions;
  merged.set(id, entry);
};
for (const row of totals) add(row.keys[0], "total", "", row);
for (const row of pages) add(row.keys[0], "page", pagePath(row.keys[1]), row);
for (const row of queries) {
  // Real phrases arrive with invisible zero-width characters that would split one phrase into two.
  const phrase = row.keys[1].replace(/[​-‍﻿]/g, "").trim();
  if (phrase && phrase.length <= MAX_KEY) add(row.keys[0], "query", phrase, row);
}
const rows = [...merged.values()];

const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslmode");
const isLocal = url.hostname === "localhost";
const client = new pg.Client({
  connectionString: url.toString(),
  ssl: isLocal ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  await client.query(
    `INSERT INTO "SearchStat" ("day", "kind", "key", "clicks", "impressions", "position")
     SELECT d::date, k, q, c, i, p
     FROM unnest($1::text[], $2::text[], $3::text[], $4::int[], $5::int[], $6::float8[]) AS t(d, k, q, c, i, p)
     ON CONFLICT ("day", "kind", "key")
     DO UPDATE SET "clicks" = EXCLUDED."clicks", "impressions" = EXCLUDED."impressions", "position" = EXCLUDED."position"`,
    [
      rows.map((r) => r.day),
      rows.map((r) => r.kind),
      rows.map((r) => r.key),
      rows.map((r) => r.clicks),
      rows.map((r) => r.impressions),
      rows.map((r) => (r.impressions > 0 ? r.weighted / r.impressions : 0)),
    ],
  );
  const latest = totals.map((row) => row.keys[0]).sort().at(-1) ?? "none";
  console.log(`Search Console sync ok: ${rows.length} rows, ${start} to ${end}, newest day with data ${latest}`);
} catch (error) {
  console.error("gsc-sync failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
