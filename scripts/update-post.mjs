/**
 * Replaces the body of an ALREADY PUBLISHED post with a rewritten version from
 * content-drafts/draft-<slug>.json (the block spec in WRITER-GUIDE.md).
 * Used to rewrite older articles in the author's voice after he approved the
 * new text. Keeps the slug, publish date, cover image, category and status;
 * updates title, excerpt, reading time, seoTitle (when the draft has one) and
 * the content. Sanity keeps revision history, so every update is reversible.
 *
 * Refuses to link to posts that are not published (a link to a missing post
 * would 404).
 *
 * Run: node scripts/update-post.mjs <slug>           (dry run)
 *      node scripts/update-post.mjs <slug> --apply   (writes, refreshes the page, checks the title)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { toPortableText } from "./lib/portable-text.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local"), quiet: true });

const slug = process.argv[2];
const APPLY = process.argv.includes("--apply");
const SITE = "https://codefromscratch.org";

if (!slug || slug.startsWith("--")) {
  console.error("usage: node scripts/update-post.mjs <slug> [--apply]");
  process.exit(2);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const existing = await client.fetch(
  `*[_type == "post" && slug.current == $slug][0]{_id, status, title, seoTitle, "blocks": count(content)}`,
  { slug },
);
if (!existing) {
  console.error(`no post with slug "${slug}"`);
  process.exit(1);
}
if (existing.status !== "published") {
  console.error(`"${slug}" is ${existing.status}; use publish-post.mjs for unpublished posts`);
  process.exit(1);
}

const draft = JSON.parse(
  readFileSync(join(__dirname, "..", "content-drafts", `draft-${slug}.json`), "utf8"),
);
const content = toPortableText(draft.blocks);

const live = new Set(await client.fetch(`*[_type == "post" && status == "published"].slug.current`));
const missing = new Set();
for (const block of content) {
  for (const def of block.markDefs ?? []) {
    if (def.href?.startsWith("/blog/")) {
      const target = def.href.replace("/blog/", "").split(/[?#]/)[0];
      if (target !== slug && !live.has(target)) missing.add(target);
    }
  }
}
if (missing.size > 0) {
  console.error(`REFUSED: links to unpublished posts: ${[...missing].join(", ")}`);
  process.exit(1);
}

const patch = {
  title: draft.title,
  excerpt: draft.excerpt,
  readingTime: draft.readingTime,
  seoDescription: draft.excerpt,
  seoTitle: draft.seoTitle ?? existing.seoTitle,
  content,
};
console.log(`${APPLY ? "APPLY" : "DRY RUN"} ${slug}`);
console.log(`  title: ${existing.title}  ->  ${draft.title}`);
console.log(`  blocks: ${existing.blocks}  ->  ${content.length}; reading time ${draft.readingTime} min`);
if (!APPLY) process.exit(0);

await client.patch(existing._id).set(patch).commit();
await fetch(`${SITE}/api/revalidate`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(process.env.SANITY_REVALIDATE_SECRET
      ? { "x-revalidate-secret": process.env.SANITY_REVALIDATE_SECRET }
      : {}),
  },
  body: JSON.stringify({ _type: "post", slug: { current: slug } }),
});
const html = await (await fetch(`${SITE}/blog/${slug}`)).text();
const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
console.log(`live title: ${title}`);
