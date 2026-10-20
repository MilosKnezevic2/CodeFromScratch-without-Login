/**
 * Replaces one exact piece of text inside a Sanity post's body (prose spans
 * only, never code blocks). Used by Fact-check & QA / Editorial to apply a
 * small correction to an already-created post without re-importing it.
 * Refuses unless the text appears exactly once.
 *
 * Run: node scripts/replace-text.mjs <slug> "<from>" "<to>"          (dry run)
 *      node scripts/replace-text.mjs <slug> "<from>" "<to>" --apply  (writes)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const [slug, from, to] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");
if (!slug || !from || to === undefined) {
  console.error('usage: node scripts/replace-text.mjs <slug> "<from>" "<to>" [--apply]');
  process.exit(2);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const doc = await client.fetch(
  `*[_type == "post" && slug.current == $slug][0]{_id, content}`,
  { slug },
);
if (!doc) {
  console.error(`no post with slug "${slug}"`);
  process.exit(1);
}

const hits = [];
for (const [bi, block] of (doc.content ?? []).entries()) {
  for (const [ci, child] of (block.children ?? []).entries()) {
    if (child._type === "span" && child.text.includes(from)) {
      const count = child.text.split(from).length - 1;
      for (let n = 0; n < count; n++) hits.push({ bi, ci });
    }
  }
}
if (hits.length !== 1) {
  console.error(`expected exactly 1 match, found ${hits.length}`);
  process.exit(1);
}

const { bi, ci } = hits[0];
const before = doc.content[bi].children[ci].text;
const after = before.replace(from, to);
console.log(`${APPLY ? "APPLY" : "DRY RUN"} ${slug}\n  before: ${before.slice(0, 160)}\n  after:  ${after.slice(0, 160)}`);
if (APPLY) {
  await client.patch(doc._id).set({ [`content[${bi}].children[${ci}].text`]: after }).commit();
  console.log("patched");
}
