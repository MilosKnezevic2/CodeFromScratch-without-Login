/**
 * Regenerate and re-attach branded covers for EVERY post (published + draft).
 * Run this after changing the cover design in app/api/og/route.tsx and
 * deploying it, so existing posts pick up the new look.
 *
 *   node scripts/recover-all.mjs
 *
 * Pulls covers from the production /api/og endpoint, so deploy your design
 * change to main first. Sanity keeps history — every change is reversible.
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const OG_BASE = "https://codefromscratch.org/api/og";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const posts = await client.fetch(
  `*[_type == "post" && status in ["published", "draft"]]{_id, title, "slug": slug.current, "category": categories[0]->title}`,
);
console.log(`Re-covering ${posts.length} posts…`);

let ok = 0;
for (const p of posts) {
  const url = `${OG_BASE}?title=${encodeURIComponent(p.title)}&category=${encodeURIComponent(p.category || "")}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.log(`  FAIL ${p.slug} → ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buf, {
    filename: `cover-${p.slug.slice(0, 55)}.png`,
    contentType: "image/png",
  });
  await client
    .patch(p._id)
    .set({
      featuredImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: p.title,
      },
    })
    .commit();
  ok++;
}
console.log(`Done: ${ok}/${posts.length} covers updated.`);
