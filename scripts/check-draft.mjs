/**
 * Mechanical pre-publish gate for an article draft (content-drafts/draft-<slug>.json).
 * Encodes the hard rules from content-drafts/WRITER-GUIDE.md so they do not
 * depend on anyone remembering them.
 *
 * Run: node scripts/check-draft.mjs <slug>
 * Exit code 1 when any ERROR is found; WARN lines never fail the run.
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/check-draft.mjs <slug>");
  process.exit(2);
}

const BANNED = [
  "delve",
  "dive into",
  "leverage",
  "robust",
  "seamless",
  "game-changer",
  "game changer",
  "unlock",
  "elevate",
  "let's explore",
  "in today's fast-paced world",
  "moreover",
  "furthermore",
  "in conclusion",
];
const BLOCK_TYPES = new Set(["lead", "p", "h2", "h3", "code", "callout", "bullet", "divider"]);
const LANGUAGES = new Set(["html", "css", "js", "jsx", "ts", "tsx", "bash", "json", "sql", "prisma"]);
const EMOJI = /\p{Extended_Pictographic}/u;

const draft = JSON.parse(
  readFileSync(join(__dirname, "..", "content-drafts", `draft-${slug}.json`), "utf8"),
);

const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

if (draft.slug !== slug) err(`slug in file ("${draft.slug}") differs from "${slug}"`);
if (!draft.title) err("missing title");
else if (draft.title.length > 60) warn(`title is ${draft.title.length} chars (target <= 60)`);
if (!draft.excerpt) err("missing excerpt");
else if (draft.excerpt.length < 140 || draft.excerpt.length > 165) {
  warn(`excerpt is ${draft.excerpt.length} chars (target 150-160)`);
}

const blocks = Array.isArray(draft.blocks) ? draft.blocks : [];
if (blocks.length === 0) err("no blocks");
if (blocks[0]?.t !== "lead") err("first block must be a lead");

const prose = [];
const hrefs = [];
let h2 = 0;
let callouts = 0;
for (const b of blocks) {
  if (!BLOCK_TYPES.has(b.t)) err(`unknown block type "${b.t}"`);
  if (b.t === "h2") h2++;
  if (b.t === "callout") callouts++;
  if (b.t === "code") {
    if (!LANGUAGES.has(b.language)) err(`code block with invalid language "${b.language}"`);
    continue;
  }
  if (b.t === "bullet") prose.push(...(b.items ?? []));
  if (b.text) prose.push(b.text);
  if (b.rich) {
    prose.push(b.rich.map((r) => r.text).join(""));
    for (const r of b.rich) if (r.href) hrefs.push(r.href);
  }
}

const text = prose.join("\n");
const words = text.split(/\s+/).filter(Boolean).length;
if (words < 1500 || words > 2200) warn(`prose is ${words} words (target 1500-2200)`);
if (h2 < 4 || h2 > 7) warn(`${h2} h2 sections (target 4-7)`);
if (callouts < 1 || callouts > 3) warn(`${callouts} callouts (target 1-3)`);

const lower = text.toLowerCase();
for (const w of BANNED) if (lower.includes(w)) err(`banned phrase: "${w}"`);
if (text.includes("!")) err("exclamation mark in prose");
if (EMOJI.test(text)) err("emoji in prose");
if (/\*\*|^#{1,6}\s/m.test(text)) err("markdown syntax in text fields");

const internal = [...new Set(hrefs.filter((h) => h.startsWith("/blog/")))];
if (internal.length < 3) warn(`${internal.length} internal links (target >= 3)`);

if (internal.length > 0) {
  if (!process.env.SANITY_API_TOKEN) {
    warn("SANITY_API_TOKEN missing: internal link targets not verified");
  } else {
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    });
    const live = new Set(
      await client.fetch(`*[_type == "post" && status == "published"].slug.current`),
    );
    for (const h of internal) {
      const target = h.replace("/blog/", "").split(/[?#]/)[0];
      if (target !== slug && !live.has(target)) {
        warn(`links to /blog/${target}, which is not published yet (publish it first)`);
      }
    }
  }
}

for (const m of errors) console.log(`ERROR  ${m}`);
for (const m of warns) console.log(`WARN   ${m}`);
console.log(
  `\n${slug}: ${words} words, ${h2} h2, ${callouts} callouts, ${internal.length} internal links — ` +
    `${errors.length} error(s), ${warns.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);
