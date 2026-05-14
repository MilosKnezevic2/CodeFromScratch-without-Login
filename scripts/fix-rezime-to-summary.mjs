/**
 * Targeted patch — replace "Rezime" with "Summary" everywhere in the
 * web-dev intro post body. Does not re-upload images.
 *
 * Run: node scripts/fix-rezime-to-summary.mjs
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const SLUG = "what-is-web-development-beginners-guide";

const post = await client.fetch(
  `*[_type == "post" && slug.current == $slug][0]{_id, content}`,
  { slug: SLUG },
);

if (!post) {
  console.error(`No post found for slug "${SLUG}"`);
  process.exit(1);
}

let changes = 0;
const next = post.content.map((block) => {
  if (block._type !== "block" || !Array.isArray(block.children)) return block;
  const children = block.children.map((child) => {
    if (typeof child?.text !== "string" || !child.text.includes("Rezime")) {
      return child;
    }
    changes += 1;
    return { ...child, text: child.text.replaceAll("Rezime", "Summary") };
  });
  return { ...block, children };
});

if (changes === 0) {
  console.log("No occurrences of 'Rezime' found — nothing to patch.");
  process.exit(0);
}

await client.patch(post._id).set({ content: next }).commit();
console.log(`Patched ${changes} occurrence(s) of "Rezime" → "Summary".`);
console.log(`→ http://localhost:3000/blog/${SLUG}`);
