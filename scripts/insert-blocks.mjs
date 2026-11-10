/**
 * Adds reviewed new blocks (a subheading with paragraphs, a list, a table)
 * to PUBLISHED articles and optionally changes their search title and
 * description, without rewriting the rest of the text.
 *
 * Plan file (JSON), one entry per article:
 *   [{ "slug": "vercel-vs-self-host",
 *      "seoTitle": "...", "seoDescription": "...",          (optional)
 *      "rewrite": true,     (a real content change: moves the visible and crawled "Updated" date)
 *      "inserts": [{ "after": "words in a paragraph" | "beforeHeading": "Exact heading",
 *                    "blocks": [{ "t": "h3", "text": "..." }, { "t": "p", "text": "**bold**, `code`, [link](slug)" },
 *                               { "t": "bullet", "items": ["..."] }, { "t": "table", "caption": "...", "rows": [["..."]] }] }] }]
 *
 * Without "rewrite" the "Updated" date stays put (a title, a description or
 * a summary table restating the text is not a rewrite). Refuses links to
 * unpublished articles and refuses to insert a block whose text is already
 * in the article, so running a plan twice cannot duplicate it. The write is
 * guarded by the document revision; Sanity keeps history, so it is reversible.
 *
 * Run: node scripts/insert-blocks.mjs <plan.json>           (dry run)
 *      node scripts/insert-blocks.mjs <plan.json> --apply   (writes, refreshes the pages, checks them live)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { blockText, buildBlocks, insertBlocks, linkedArticleSlugs } from "./lib/insert-blocks.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local"), quiet: true });

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const SITE = "https://codefromscratch.org";

if (!planPath || planPath.startsWith("--")) {
  console.error("usage: node scripts/insert-blocks.mjs <plan.json> [--apply]");
  process.exit(2);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const plan = JSON.parse(readFileSync(resolve(planPath), "utf8"));
const live = new Set(await client.fetch(`*[_type == "post" && status == "published"].slug.current`));
const makeKey = () => randomUUID().slice(0, 12);

let failures = 0;
const written = [];
for (const entry of plan) {
  console.log(`\n${entry.slug}${entry.rewrite ? "  (rewrite: moves the Updated date)" : ""}`);
  const post = await client.fetch(
    `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, _rev, status, seoTitle, seoDescription, content}`,
    { slug: entry.slug },
  );
  if (!post || post.status !== "published") {
    console.log("  REFUSED: not a published article");
    failures++;
    continue;
  }
  try {
    let content = post.content;
    for (const insert of entry.inserts ?? []) {
      const blocks = buildBlocks(insert.blocks, makeKey);
      const missing = linkedArticleSlugs(blocks).filter((s) => !live.has(s));
      if (missing.length > 0) throw new Error(`links to unpublished articles: ${missing.join(", ")}`);
      const existing = new Set(content.map(blockText));
      const duplicate = blocks.find((b) => blockText(b) && existing.has(blockText(b)));
      if (duplicate) throw new Error(`already in the article: "${blockText(duplicate).slice(0, 60)}"`);
      content = insertBlocks(content, insert, blocks);
      console.log(`  + ${blocks.length} blocks ${insert.after ? `after "${insert.after}"` : `before "${insert.beforeHeading}"`}`);
      for (const b of blocks) console.log(`      ${b._type === "table" ? "table" : b.listItem ? "-" : b.style}: ${blockText(b).slice(0, 110)}`);
    }
    const set = { content };
    if (entry.seoTitle) {
      if (entry.seoTitle.length > 60) throw new Error(`seoTitle is ${entry.seoTitle.length} characters (max 60)`);
      set.seoTitle = entry.seoTitle;
      console.log(`  seoTitle: ${post.seoTitle}  ->  ${entry.seoTitle}`);
    }
    if (entry.seoDescription) {
      if (entry.seoDescription.length > 160) throw new Error(`seoDescription is ${entry.seoDescription.length} characters (max 160)`);
      set.seoDescription = entry.seoDescription;
      console.log(`  seoDescription (${entry.seoDescription.length}): ${entry.seoDescription}`);
    }
    if (entry.rewrite) set.contentUpdatedAt = new Date().toISOString();
    if (APPLY) {
      await client.patch(post._id).ifRevisionId(post._rev).set(set).commit();
      written.push(entry);
    }
  } catch (error) {
    console.log(`  FAILED: ${error.message}`);
    failures++;
  }
}

console.log(`\n${APPLY ? "APPLIED" : "DRY RUN"}: ${written.length || "no"} articles written, ${failures} problems`);
if (!APPLY || written.length === 0) process.exit(failures > 0 ? 1 : 0);

for (const entry of written) {
  await fetch(`${SITE}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.SANITY_REVALIDATE_SECRET ? { "x-revalidate-secret": process.env.SANITY_REVALIDATE_SECRET } : {}),
    },
    body: JSON.stringify({ _type: "post", slug: { current: entry.slug } }),
  });
}
for (const entry of written) {
  const html = await (await fetch(`${SITE}/blog/${entry.slug}`, { cache: "no-store" })).text();
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  const firstNew = entry.inserts?.[0]?.blocks?.[0];
  const sample = firstNew?.text ?? firstNew?.caption;
  console.log(`live ${entry.slug}: title "${title}"${sample ? `, new text ${html.includes(sample) ? "present" : "not yet visible"}` : ""}`);
}
process.exit(failures > 0 ? 1 : 0);
