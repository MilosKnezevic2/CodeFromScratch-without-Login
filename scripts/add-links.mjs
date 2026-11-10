/**
 * Adds in-text links to PUBLISHED articles from a reviewed plan, without
 * rewriting them. Unlike update-post.mjs it never moves contentUpdatedAt: a
 * new link is not a rewrite, and the "Updated" date must only mean one.
 *
 * Plan file (JSON), one entry per article:
 *   [{ "slug": "testing-react-applications-a-complete-strategy",
 *      "links": [
 *        { "target": "login-form-validation-client-and-server", "anchor": "a login form", "near": "pattern applied to a login form" },
 *        { "append": { "after": "words in the paragraph", "text": "A sentence with [anchor](target-slug)." } }
 *      ] }]
 *
 * Refuses a link to an unpublished article and skips a target the article
 * already links to. Prints every changed paragraph for review. Sanity keeps
 * revision history, so each write is reversible; the write is guarded by the
 * document revision, so an edit made in Studio meanwhile is never overwritten.
 *
 * Run: node scripts/add-links.mjs <plan.json>           (dry run)
 *      node scripts/add-links.mjs <plan.json> --apply   (writes, refreshes the pages, checks the links live)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { appendSentence, linkExisting, linkedSlugs, previewBlock, sentenceTargets } from "./lib/add-links.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local"), quiet: true });

const planPath = process.argv[2];
const APPLY = process.argv.includes("--apply");
const SITE = "https://codefromscratch.org";

if (!planPath || planPath.startsWith("--")) {
  console.error("usage: node scripts/add-links.mjs <plan.json> [--apply]");
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
  const post = await client.fetch(
    `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0]{_id, _rev, status, content}`,
    { slug: entry.slug },
  );
  console.log(`\n${entry.slug}`);
  if (!post || post.status !== "published") {
    console.log(`  REFUSED: not a published article`);
    failures++;
    continue;
  }
  let content = post.content;
  const touched = new Set();
  let changes = 0;
  for (const link of entry.links) {
    const targets = link.append ? sentenceTargets(link.append.text) : [link.target];
    const unpublished = targets.filter((t) => !live.has(t) || t === entry.slug);
    if (unpublished.length > 0) {
      console.log(`  REFUSED: not a published article to link to: ${unpublished.join(", ")}`);
      failures++;
      continue;
    }
    const already = targets.filter((t) => linkedSlugs(content).has(t));
    if (already.length > 0) {
      console.log(`  skip: already links to ${already.join(", ")}`);
      continue;
    }
    try {
      const before = content;
      content = link.append
        ? appendSentence(content, link.append, makeKey)
        : linkExisting(content, { anchor: link.anchor, near: link.near, href: `/blog/${link.target}` }, makeKey);
      const index = content.findIndex((b, i) => b !== before[i]);
      touched.add(content[index]._key);
      changes++;
    } catch (error) {
      console.log(`  FAILED: ${error.message}`);
      failures++;
    }
  }
  for (const block of content.filter((b) => touched.has(b._key))) console.log(`  > ${previewBlock(block)}`);
  if (changes === 0) continue;
  if (APPLY) {
    await client.patch(post._id).ifRevisionId(post._rev).set({ content }).commit();
    written.push(entry.slug);
  }
}

console.log(`\n${APPLY ? "APPLIED" : "DRY RUN"}: ${written.length || "no"} articles written, ${failures} problems`);
if (!APPLY || written.length === 0) process.exit(failures > 0 ? 1 : 0);

for (const slug of written) {
  await fetch(`${SITE}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.SANITY_REVALIDATE_SECRET ? { "x-revalidate-secret": process.env.SANITY_REVALIDATE_SECRET } : {}),
    },
    body: JSON.stringify({ _type: "post", slug: { current: slug } }),
  });
}
// The page is rebuilt on the next request after the revalidation; read each one back.
for (const entry of plan.filter((e) => written.includes(e.slug))) {
  const html = await (await fetch(`${SITE}/blog/${entry.slug}`, { cache: "no-store" })).text();
  const targets = entry.links.flatMap((l) => (l.append ? sentenceTargets(l.append.text) : [l.target]));
  const missing = targets.filter((t) => !html.includes(`href="/blog/${t}"`));
  console.log(`live ${entry.slug}: ${missing.length === 0 ? "all links present" : `not yet visible: ${missing.join(", ")}`}`);
}
process.exit(failures > 0 ? 1 : 0);
