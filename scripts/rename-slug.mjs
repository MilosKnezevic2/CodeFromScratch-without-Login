/**
 * Renames a published article's slug and points every in-text link at the
 * new address. Refuses to run until next.config.ts carries the permanent
 * redirect from the old address, so search engines and old links never
 * meet a 404. Order: merge the redirect, wait for the deploy, then run this.
 *
 * Run: node scripts/rename-slug.mjs <old-slug> <new-slug>           (dry run)
 *      node scripts/rename-slug.mjs <old-slug> <new-slug> --apply   (writes, refreshes, checks the redirect live)
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local"), quiet: true });

const [from, to] = process.argv.slice(2);
const APPLY = process.argv.includes("--apply");
const SITE = "https://codefromscratch.org";
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

if (!SLUG.test(from ?? "") || !SLUG.test(to ?? "")) {
  console.error("usage: node scripts/rename-slug.mjs <old-slug> <new-slug> [--apply]");
  process.exit(2);
}

const config = readFileSync(join(__dirname, "..", "next.config.ts"), "utf8");
if (!config.includes(`"/blog/${from}"`) || !config.includes(`"/blog/${to}"`)) {
  console.error(`REFUSED: next.config.ts has no redirect /blog/${from} -> /blog/${to}`);
  process.exit(1);
}
const redirect = await fetch(`${SITE}/blog/${from}`, { redirect: "manual" });
if (redirect.status !== 308 || !redirect.headers.get("location")?.endsWith(`/blog/${to}`)) {
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

const post = await client.fetch(`*[_type == "post" && slug.current == $from && !(_id in path("drafts.**"))][0]{_id, _rev, status}`, {
  from,
});
if (!post) {
  console.error(`no post with slug "${from}"`);
  process.exit(1);
}
const taken = await client.fetch(`count(*[_type == "post" && slug.current == $to])`, { to });
if (taken > 0) {
  console.error(`REFUSED: "${to}" is already used`);
  process.exit(1);
}

const oldHref = new RegExp(`^/blog/${from}(?=$|[#?])`);
const linking = (
  await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))]{_id, _rev, "slug": slug.current, content}`)
).filter((p) => (p.content ?? []).some((block) => block.markDefs?.some((d) => oldHref.test(d.href ?? ""))));
console.log(`${APPLY ? "APPLY" : "DRY RUN"} /blog/${from} -> /blog/${to}`);
console.log(`  articles linking to it: ${linking.map((p) => p.slug).join(", ") || "none"}`);
if (!APPLY) process.exit(0);

const tx = client.transaction();
tx.patch(post._id, (p) => p.ifRevisionId(post._rev).set({ "slug.current": to }));
for (const p of linking) {
  const content = p.content.map((block) =>
    block.markDefs?.some((d) => oldHref.test(d.href ?? ""))
      ? { ...block, markDefs: block.markDefs.map((d) => ({ ...d, href: d.href?.replace(oldHref, `/blog/${to}`) })) }
      : block,
  );
  tx.patch(p._id, (patch) => patch.ifRevisionId(p._rev).set({ content }));
}
await tx.commit();

for (const slug of [to, ...linking.map((p) => p.slug)]) {
  await fetch(`${SITE}/api/revalidate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.SANITY_REVALIDATE_SECRET ? { "x-revalidate-secret": process.env.SANITY_REVALIDATE_SECRET } : {}),
    },
    body: JSON.stringify({ _type: "post", slug: { current: slug } }),
  });
}
const page = await fetch(`${SITE}/blog/${to}`, { cache: "no-store" });
console.log(`live /blog/${to}: ${page.status}`);
