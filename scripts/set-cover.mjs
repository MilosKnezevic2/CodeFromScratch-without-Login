/**
 * Generate and attach a branded cover for ONE post.
 *
 *   node scripts/set-cover.mjs <post-slug>
 *
 * Fetches the branded cover from the production /api/og endpoint for the
 * post's current title + category, uploads it to Sanity, and sets it as the
 * featuredImage. Sanity keeps history, so re-running just adds a new version.
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const OG_BASE = "https://codefromscratch.org/api/og";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/set-cover.mjs <post-slug>");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const post = await client.fetch(
  `*[_type == "post" && slug.current == $slug][0]{_id, title, "category": categories[0]->title}`,
  { slug },
);
if (!post) {
  console.error(`No post found with slug "${slug}"`);
  process.exit(1);
}

const url = `${OG_BASE}?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category || "")}`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`Cover generation failed: ${res.status}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
const asset = await client.assets.upload("image", buf, {
  filename: `cover-${slug.slice(0, 60)}.png`,
  contentType: "image/png",
});
await client
  .patch(post._id)
  .set({
    featuredImage: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt: post.title,
    },
  })
  .commit();

console.log(`Cover set for "${post.title}" (${slug}).`);
