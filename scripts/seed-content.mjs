/**
 * Content-wave importer (docs/CONTENT-PLAN.md).
 *
 * Loads every part-file in scripts/content/ (cycle-*.mjs), validates it,
 * and imports posts into Sanity as status:"published" with their planned
 * FUTURE publishedAt — the public queries gate on `publishedAt <= now()`,
 * so each article goes live by itself on its scheduled Mon/Wed/Fri slot.
 *
 * Idempotent: existing slugs are skipped, so it is safe to run after any
 * batch, or once at the very end.
 *
 *   node scripts/seed-content.mjs --dry   # validate + print plan, write nothing
 *   node scripts/seed-content.mjs         # import (needs .env.local with SANITY_API_TOKEN)
 */

import { readdir } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { slugify, k } from "./content/pt.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(__dirname, "content");
const DRY = process.argv.includes("--dry");

const AUTHOR_NAME = "Milos Knezevic";

const CATEGORIES = [
  "Web Fundamentals",
  "JavaScript Frameworks",
  "CSS Ecosystem",
  "Backend Technologies",
  "Databases",
  "APIs & Integrations",
  "Backend-as-a-Service",
  "DevOps & Infrastructure",
  "Cloud & Hosting",
  "Testing",
  "Performance",
];

const TAGS = [
  "React", "Next.js", "TypeScript", "Node.js", "CSS", "TailwindCSS",
  "PostgreSQL", "Prisma & ORMs", "Supabase", "Docker", "Vercel",
  "Git & GitHub", "GraphQL", "REST API Design", "WebSockets & Realtime",
  "Auth Systems", "Jest & Vitest", "Testing Library", "Cypress & Playwright",
  "Web Performance & Core Web Vitals", "SEO & Technical SEO", "Express.js",
  "Python", "Go (Golang)",
  // Approved additions for this wave (see CONTENT-PLAN "Tags")
  "Security", "Serverless", "Caching",
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

function validatePost(post, source) {
  const where = `${source} → "${post.title ?? "?"}"`;
  if (!post.title || post.title.length < 10 || post.title.length > 120) fail(`${where}: title length`);
  if (!post.excerpt || post.excerpt.length < 60 || post.excerpt.length > 280) fail(`${where}: excerpt must be 60–280 chars (is ${post.excerpt?.length ?? 0})`);
  if (!CATEGORIES.includes(post.categoryName)) fail(`${where}: unknown category "${post.categoryName}"`);
  if (!Array.isArray(post.tagNames) || post.tagNames.length < 2 || post.tagNames.length > 4) fail(`${where}: 2–4 tags required`);
  for (const t of post.tagNames ?? []) {
    if (!TAGS.includes(t)) fail(`${where}: unknown tag "${t}"`);
  }
  if (!DIFFICULTIES.includes(post.difficulty)) fail(`${where}: difficulty must be one of ${DIFFICULTIES.join("/")}`);
  if (!post.seoTitle || post.seoTitle.length > 70) fail(`${where}: seoTitle required, ≤70 chars (is ${post.seoTitle?.length ?? 0})`);
  if (!post.seoDescription || post.seoDescription.length > 170) fail(`${where}: seoDescription required, ≤170 chars (is ${post.seoDescription?.length ?? 0})`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(post.publishDate ?? "")) fail(`${where}: publishDate must be YYYY-MM-DD`);
  if (!post.imageUrl || !post.imageUrl.startsWith("https://")) fail(`${where}: imageUrl required`);
  if (!post.imageAlt || post.imageAlt.length < 3 || post.imageAlt.length > 125) fail(`${where}: imageAlt 3–125 chars`);
  if (!Number.isInteger(post.readingTime) || post.readingTime < 1 || post.readingTime > 120) fail(`${where}: readingTime 1–120`);
  if (!Array.isArray(post.content) || post.content.length < 10) fail(`${where}: content looks too short (${post.content?.length ?? 0} blocks)`);
}

async function loadParts() {
  const files = (await readdir(CONTENT_DIR))
    .filter((f) => f.startsWith("cycle-") && f.endsWith(".mjs"))
    .sort();
  const all = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(join(CONTENT_DIR, file)).href);
    if (!Array.isArray(mod.posts)) {
      fail(`${file}: must export a \`posts\` array`);
      continue;
    }
    for (const post of mod.posts) {
      validatePost(post, file);
      all.push({ ...post, __source: file });
    }
  }
  return all;
}

async function main() {
  const posts = await loadParts();

  // Slug collisions inside the wave itself
  const seen = new Map();
  for (const post of posts) {
    const slug = slugify(post.title);
    if (seen.has(slug)) fail(`duplicate slug "${slug}" (${seen.get(slug)} and ${post.__source})`);
    seen.set(slug, post.__source);
  }

  if (process.exitCode) {
    console.error("\nValidation failed — nothing imported.");
    return;
  }

  console.log(`Loaded ${posts.length} posts from scripts/content/*.mjs\n`);
  const byDate = [...posts].sort((a, b) => a.publishDate.localeCompare(b.publishDate));
  for (const post of byDate) {
    console.log(`  ${post.publishDate}  [${post.categoryName}]  ${post.title}`);
  }

  if (DRY) {
    console.log("\n--dry run: validation passed, nothing written.");
    return;
  }

  // Live import — env + client only past this point, so --dry works offline.
  const { createClient } = await import("@sanity/client");
  const dotenv = (await import("dotenv")).default;
  dotenv.config({ path: join(__dirname, "..", ".env.local") });

  if (!process.env.SANITY_API_TOKEN) {
    fail("SANITY_API_TOKEN missing — add it to .env.local (Sanity → API → Tokens, Editor role).");
    return;
  }

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });

  async function uploadImage(url, filename) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`image fetch ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const asset = await client.assets.upload("image", buf, { filename });
    return asset._id;
  }

  // Author — the site's single voice (E-E-A-T entity used in Article JSON-LD).
  let author = await client.fetch(`*[_type == "author" && name == $name][0]{ _id }`, { name: AUTHOR_NAME });
  if (!author) {
    author = await client.create({
      _type: "author",
      name: AUTHOR_NAME,
      slug: { _type: "slug", current: slugify(AUTHOR_NAME) },
      bio: "Full-stack web developer. I build production systems and write down what actually works.",
    });
    console.log(`✅ Created author ${AUTHOR_NAME}`);
  }

  async function ensureCategory(title) {
    const existing = await client.fetch(`*[_type == "category" && title == $title][0]{ _id }`, { title });
    if (existing) return existing._id;
    const doc = await client.create({
      _type: "category",
      title,
      slug: { _type: "slug", current: slugify(title) },
    });
    console.log(`✅ Created category ${title}`);
    return doc._id;
  }

  async function ensureTag(title, categoryId) {
    const existing = await client.fetch(`*[_type == "tag" && title == $title][0]{ _id }`, { title });
    if (existing) return existing._id;
    const doc = await client.create({
      _type: "tag",
      title,
      slug: { _type: "slug", current: slugify(title) },
      ...(categoryId ? { category: { _type: "reference", _ref: categoryId } } : {}),
    });
    console.log(`✅ Created tag ${title}`);
    return doc._id;
  }

  let created = 0;
  let skipped = 0;
  for (const post of byDate) {
    const slug = slugify(post.title);
    const existing = await client.fetch(`*[_type == "post" && slug.current == $slug][0]{ _id }`, { slug });
    if (existing) {
      console.log(`⏭️  ${slug} already exists — skipped`);
      skipped++;
      continue;
    }

    const categoryId = await ensureCategory(post.categoryName);
    const tagRefs = [];
    for (const tagName of post.tagNames) {
      const tagId = await ensureTag(tagName, categoryId);
      tagRefs.push({ _type: "reference", _ref: tagId, _key: k() });
    }

    let imageAssetId = null;
    try {
      imageAssetId = await uploadImage(post.imageUrl, `${slug}.jpg`);
    } catch (err) {
      console.warn(`⚠️  ${slug}: image upload failed (${err.message}) — attach a cover in Studio before its publish date.`);
    }

    await client.create({
      _type: "post",
      title: post.title,
      slug: { _type: "slug", current: slug },
      author: { _type: "reference", _ref: author._id },
      excerpt: post.excerpt,
      content: post.content,
      categories: [{ _type: "reference", _ref: categoryId, _key: k() }],
      tags: tagRefs,
      status: "published",
      isPremium: false,
      difficulty: post.difficulty,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      publishedAt: `${post.publishDate}T07:00:00.000Z`,
      readingTime: post.readingTime,
      ...(imageAssetId
        ? {
            featuredImage: {
              _type: "image",
              asset: { _type: "reference", _ref: imageAssetId },
              alt: post.imageAlt,
            },
          }
        : {}),
    });
    console.log(`✅ ${post.publishDate}  ${slug}`);
    created++;
  }

  console.log(`\nDone: ${created} imported, ${skipped} already existed.`);
  console.log("Future-dated posts appear automatically on their Mon/Wed/Fri slots — no clicks needed.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
