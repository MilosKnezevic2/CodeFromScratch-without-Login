/**
 * Reads Search Console data for the site with a read-only service account and
 * prints a compact report: totals, top queries, top pages, sitemap status.
 *
 * Key file: .secrets/gsc-key.json (git-ignored). Property: sc-domain:codefromscratch.org
 *
 * Run: node scripts/gsc-report.mjs [days=28]
 * Output also saved to brand-brain/research/gsc-<YYYY-MM-DD>.json when that folder exists.
 */

import { writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { SITE, gscApi } from "./lib/gsc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const days = Number(process.argv[2] ?? 28);
const api = await gscApi(join(root, ".secrets", "gsc-key.json"));

// Search Analytics data lags about two days; end there.
const end = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
const start = new Date(Date.now() - (days + 2) * 864e5).toISOString().slice(0, 10);
const query = (dimensions, rowLimit = 10) =>
  api("/searchAnalytics/query", {
    method: "POST",
    body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit }),
  });

const [totals, queries, pages, sitemaps] = await Promise.all([
  query([], 1),
  query(["query"]),
  query(["page"]),
  api("/sitemaps"),
]);

const t = totals.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
const fmt = (r) =>
  `${String(r.clicks).padStart(4)} clicks ${String(r.impressions).padStart(6)} impr  pos ${r.position.toFixed(1).padStart(5)}`;

console.log(`Search Console ${SITE}  ${start} to ${end} (${days} days)`);
console.log(`TOTAL  ${fmt(t)}  ctr ${(t.ctr * 100).toFixed(1)}%\n`);
console.log("Top queries");
for (const r of queries.rows ?? []) console.log(`  ${fmt(r)}  ${r.keys[0]}`);
if (!queries.rows?.length) console.log("  (none yet)");
console.log("\nTop pages");
for (const r of pages.rows ?? []) console.log(`  ${fmt(r)}  ${r.keys[0].replace("https://codefromscratch.org", "")}`);
if (!pages.rows?.length) console.log("  (none yet)");
console.log("\nSitemaps");
for (const s of sitemaps.sitemap ?? []) {
  const submitted = s.contents?.map((c) => `${c.type}: ${c.submitted} submitted, ${c.indexed ?? "?"} indexed`).join("; ");
  console.log(`  ${s.path}  last read ${s.lastDownloaded?.slice(0, 10) ?? "never"}  errors ${s.errors}  warnings ${s.warnings}  ${submitted ?? ""}`);
}

const out = join(root, "brand-brain", "research");
if (existsSync(out)) {
  writeFileSync(
    join(out, `gsc-${new Date().toISOString().slice(0, 10)}.json`),
    JSON.stringify({ site: SITE, start, end, totals: t, queries: queries.rows, pages: pages.rows, sitemaps: sitemaps.sitemap }, null, 2),
  );
}
