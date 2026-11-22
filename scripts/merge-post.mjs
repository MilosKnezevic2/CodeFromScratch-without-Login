/**
 * Merges a published article into a stronger one on the same topic: every
 * in-text link to the old address points at the stronger article, and the
 * old article is unpublished (it stays in Studio as a draft, and a full copy
 * is written to content-drafts/ first). Refuses to run until next.config.ts
 * carries the permanent redirect and the live site serves it, so the old
 * address never meets a 404.
 *
 * Run: node scripts/merge-post.mjs <old-slug> <into-slug>           (dry run)
 *      node scripts/merge-post.mjs <old-slug> <into-slug> --apply   (writes, refreshes, checks live)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { repointLinks } from "./lib/merge-links.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
dotenv.config({ path: join(root, ".env.local"), quiet: true });

const [from, into] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const SITE = "https://codefromscratch.org";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

if (!SLUG.test(from ?? "") || !SLUG.test(into ?? "") || from === into) {
  console.error("usage: node scripts/merge-post.mjs <old-slug> <into-slug> [--apply]");
  process.exit(2);
}

const config = readFileSync(join(root, "next.config.ts"), "utf8");
if (!config.includes(`"/blog/${from}"`) || !config.includes(`"/blog/${into}"`)) {
  console.error(`REFUSED: next.config.ts has no redirect /blog/${from} -> /blog/${into}`);
  process.exit(1);
}
const redirect = await fetch(`${SITE}/blog/${from}`, { redirect: "manual" });
if (redirect.status !== 308 || !redirect.headers.get("location")?.endsWith(`/blog/${into}`)) {
  console.error(`REFUSED: the live site does not redirect /blog/${from} yet (got ${redirect.status}); deploy first`);
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const published = `!(_id in path("drafts.**"))`;
const old = await client.fetch(`*[_type == "post" && slug.current == $from && ${published}][0]`, { from });
const target = await client.fetch(`*[_type == "post" && slug.current == $into && ${published}][0]{_id}`, { into });
if (!old || !target) {
  console.error(`REFUSED: both articles must be published (${from}: ${Boolean(old)}, ${into}: ${Boolean(target)})`);
  process.exit(1);
}
const draftExists = await client.fetch(`count(*[_id == $id])`, { id: `drafts.${old._id}` });
if (draftExists > 0) {
  console.error(`REFUSED: ${from} has an unsaved draft in Studio; publish or discard it first`);
  process.exit(1);
}
const referrers = await client.fetch(`*[references($id) && ${published}]{_id, _type}`, { id: old._id });
if (referrers.length > 0) {
  console.error(`REFUSED: other documents reference ${from}: ${referrers.map((r) => `${r._type} ${r._id}`).join(", ")}`);
  process.exit(1);
}

const posts = await client.fetch(`*[_type == "post" && ${published} && _id != $id]{_id, _rev, "slug": slug.current, content}`, {
  id: old._id,
});
const changes = posts
  .map((p) => ({ ...p, ...repointLinks(p.content ?? [], { from, into, self: p._id === target._id }) }))
  .filter((p) => p.repointed + p.unlinked > 0);

console.log(`${APPLY ? "APPLY" : "DRY RUN"} merge /blog/${from} -> /blog/${into}`);
for (const p of changes) console.log(`  ${p.slug}: ${p.repointed} link(s) repointed, ${p.unlinked} removed`);
console.log(`  ${from}: unpublished, kept in Studio as a draft`);
if (!APPLY) process.exit(0);

const backupDir = join(root, "content-drafts");
mkdirSync(backupDir, { recursive: true });
const backup = join(backupDir, `_merged-${from}.json`);
writeFileSync(backup, `${JSON.stringify(old, null, 2)}\n`);
console.log(`backup: ${backup}`);

const doc = Object.fromEntries(Object.entries(old).filter(([key]) => !["_rev", "_createdAt", "_updatedAt"].includes(key)));
const tx = client.transaction();
for (const p of changes) tx.patch(p._id, (patch) => patch.ifRevisionId(p._rev).set({ content: p.content }));
tx.createIfNotExists({ ...doc, _id: `drafts.${old._id}` });
tx.delete(old._id);
await tx.commit();

for (const slug of [from, into, ...changes.map((p) => p.slug)]) {
  const res = await fetch(`${SITE}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.SANITY_REVALIDATE_SECRET ? { "x-revalidate-secret": process.env.SANITY_REVALIDATE_SECRET } : {}),
    },
    body: JSON.stringify({ _type: "post", slug: { current: slug } }),
  });
  console.log(`revalidate ${slug}: ${res.status}`);
}
const page = await fetch(`${SITE}/blog/${into}`, { cache: "no-store" });
console.log(`live /blog/${into}: ${page.status}`);
