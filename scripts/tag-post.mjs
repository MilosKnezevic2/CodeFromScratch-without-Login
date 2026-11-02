/**
 * Sets the tags of a published post from the existing tag documents, so the
 * "Same topic" picks under an article have something to match on.
 *
 *   node scripts/tag-post.mjs --list                       (every tag slug with its post count)
 *   node scripts/tag-post.mjs <slug> css,html,react        (dry run: shows current -> new)
 *   node scripts/tag-post.mjs <slug> css,html,react --apply (writes, then asks the site to refresh the post)
 *
 * The tag list replaces the post's tags. Unknown slugs stop the run; nothing
 * is created, because 86 of the 101 tags are still empty and more thin tag
 * pages help nobody.
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const SITE = "https://codefromscratch.org";
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

const tags = await client.fetch(
  `*[_type == "tag"] { _id, title, "slug": slug.current, "n": count(*[_type == "post" && status == "published" && references(^._id)]) } | order(n desc, title)`,
);

if (args.includes("--list")) {
  for (const t of tags) console.log(`${t.slug.padEnd(40)} ${t.n}  ${t.title}`);
  process.exit(0);
}

const [slug, list] = args.filter((a) => !a.startsWith("--"));
if (!slug || !list) {
  console.error("usage: node scripts/tag-post.mjs <post-slug> <tag-slug,tag-slug,...> [--apply] | --list");
  process.exit(1);
}
const wanted = [...new Set(list.split(",").map((s) => s.trim()).filter(Boolean))];
const unknown = wanted.filter((s) => !tags.some((t) => t.slug === s));
if (unknown.length > 0) {
  console.error(`unknown tag slug(s): ${unknown.join(", ")} — run --list to see what exists`);
  process.exit(1);
}

const post = await client.fetch(
  `*[_type == "post" && slug.current == $slug][0] { _id, title, "tags": tags[]->slug.current }`,
  { slug },
);
if (!post) {
  console.error(`no post with slug ${slug}`);
  process.exit(1);
}
console.log(`${APPLY ? "APPLY" : "DRY RUN"} — "${post.title}"`);
console.log(`  now: ${(post.tags ?? []).join(", ") || "(no tags)"}`);
console.log(`  new: ${wanted.join(", ")}`);
if (!APPLY) process.exit(0);

const refs = wanted.map((s) => ({ _type: "reference", _ref: tags.find((t) => t.slug === s)._id, _key: `tag-${s}` }));
await client.patch(post._id).set({ tags: refs }).commit();
console.log("written");

const res = await fetch(`${SITE}/api/revalidate`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    ...(process.env.SANITY_REVALIDATE_SECRET ? { "x-revalidate-secret": process.env.SANITY_REVALIDATE_SECRET } : {}),
  },
  body: JSON.stringify({ _type: "post", slug: { current: slug } }),
});
console.log(`revalidate: ${res.status} (other articles refresh their picks on their own hourly cycle)`);
