/**
 * Asks Google how a few of our URLs are indexed (URL Inspection API).
 * Read-only; quota is 2,000 inspections a day. Run: node scripts/gsc-inspect.mjs [url ...]
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { gscToken, SITE } from "./lib/gsc.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const token = await gscToken(join(root, ".secrets", "gsc-key.json"));
const urls = process.argv.slice(2);
for (const url of urls) {
  try {
    const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
    });
    const body = await res.json();
    if (!res.ok) { console.log(url, "->", res.status, body.error?.message); continue; }
    const r = body.inspectionResult?.indexStatusResult ?? {};
    console.log(url.replace("https://codefromscratch.org", ""), "|", r.verdict, "|", r.coverageState, "| crawled", r.lastCrawlTime?.slice(0, 10) ?? "never", "| canonical", r.googleCanonical ? r.googleCanonical.replace("https://codefromscratch.org", "") : "-");
  } catch (e) { console.log(url, "ERR", e.message); }
}
