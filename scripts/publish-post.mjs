/**
 * Publishes one article to the live site, after the operator has approved it.
 *
 *  - Slug already in Sanity as a draft  -> flips status to "published".
 *  - Slug not in Sanity yet             -> creates it from
 *    content-drafts/draft-<slug>.json (needs --category), with a branded cover.
 *
 * Refuses to publish when the article links to a /blog/ post that is not
 * published (that link would 404). Sanity keeps revision history, so every
 * write is reversible from Studio.
 *
 * Several slugs can be given at once. Articles of one series link to each
 * other and to their pillar, so a series is published as one batch: links
 * inside the batch count as live; anything else must already be published.
 *
 * Run: node scripts/publish-post.mjs <slug...> [--category "Name"] [--date ISO]          (dry run)
 *      node scripts/publish-post.mjs <slug...> [--category "Name"] [--date ISO] --apply  (writes)
 *
 * After --apply it asks the site to revalidate and checks the live URL.
 */

import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";
import { toPortableText } from "./lib/portable-text.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const args = process.argv.slice(2);
const FLAGS_WITH_VALUE = new Set(["--category", "--date"]);
const slugs = args.filter((a, i) => !a.startsWith("--") && !FLAGS_WITH_VALUE.has(args[i - 1]));
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const APPLY = args.includes("--apply");
const SITE = "https://codefromscratch.org";
const OG_BASE = "https://codefromscratch-ten.vercel.app/api/og";
const MILOS_AUTHOR_ID = "47455f55-daea-449c-b813-f1d8d3c4b08b";

if (slugs.length === 0) {
  console.error('usage: node scripts/publish-post.mjs <slug...> [--category "Name"] [--date ISO] [--apply]');
  process.exit(2);
}
if (!process.env.SANITY_API_TOKEN) {
  console.error("SANITY_API_TOKEN is not set in .env.local");
  process.exit(2);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const k = () => randomUUID().slice(0, 12);

function internalLinks(content) {
  const found = new Set();
  for (const block of content) {
    for (const def of block.markDefs ?? []) {
      if (def.href?.startsWith("/blog/")) found.add(def.href.replace("/blog/", "").split(/[?#]/)[0]);
    }
  }
  return [...found];
}

async function uploadCover(slug, title, categoryName) {
  const url = `${OG_BASE}?title=${encodeURIComponent(title)}&category=${encodeURIComponent(categoryName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OG fetch ${res.status} for "${title}"`);
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buf, {
    filename: `cover-${slug}.png`,
    contentType: "image/png",
  });
  return asset._id;
}

const INDEXNOW_KEY = "dd671c2ccc673598cd70b9f8b2a9ff2c";

/**
 * Tells Bing (and other IndexNow engines) about new URLs immediately.
 * Google does not support IndexNow; it learns from sitemap.xml. A failure
 * here is reported but never blocks a publish.
 */
async function pingIndexNow(urls) {
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    console.log(`indexnow: ${res.status}`);
  } catch (e) {
    console.log(`indexnow failed (publish unaffected): ${e.message}`);
  }
}

async function verifyLive(slug) {
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
  const res = await fetch(`${SITE}/blog/${slug}`, { redirect: "follow" });
  console.log(`live check: GET /blog/${slug} -> ${res.status}`);
  if (!res.ok) process.exitCode = 1;
}

async function prepare(slug) {
  const existing = await client.fetch(
    `*[_type == "post" && slug.current == $slug][0]{_id, status, title, content}`,
    { slug },
  );
  if (existing?.status === "published") return { slug, skip: true };
  if (existing) return { slug, existing, content: existing.content ?? [] };
  const draft = JSON.parse(
    readFileSync(join(__dirname, "..", "content-drafts", `draft-${slug}.json`), "utf8"),
  );
  return { slug, draft, content: toPortableText(draft.blocks) };
}

async function main() {
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} — ${slugs.join(", ")}
`);
  const jobs = [];
  for (const slug of slugs) jobs.push(await prepare(slug));
  for (const j of jobs.filter((x) => x.skip)) console.log(`${j.slug}: already published, skipped`);
  const todo = jobs.filter((x) => !x.skip);

  const live = new Set(
    await client.fetch(`*[_type == "post" && status == "published"].slug.current`),
  );
  for (const j of todo) live.add(j.slug);
  let refused = false;
  for (const j of todo) {
    const missing = internalLinks(j.content).filter((t) => !live.has(t));
    if (missing.length > 0) {
      console.error(`REFUSED ${j.slug}: links to unpublished posts: ${missing.join(", ")}`);
      refused = true;
    }
  }
  if (refused) process.exit(1);

  const publishedAt = flag("date") ?? new Date().toISOString();
  const categoryName = flag("category");
  let categoryId;
  if (todo.some((j) => !j.existing)) {
    if (!categoryName) {
      console.error('new post(s) need --category "<existing category title>"');
      process.exit(2);
    }
    categoryId = await client.fetch(`*[_type == "category" && title == $t][0]._id`, { t: categoryName });
    if (!categoryId) {
      console.error(`category "${categoryName}" does not exist in Sanity; create it in Studio first`);
      process.exit(2);
    }
  }

  for (const j of todo) {
    if (j.existing) {
      console.log(`flip "${j.existing.title}" (${j.existing._id}) draft -> published at ${publishedAt}`);
      if (!APPLY) continue;
      await client.patch(j.existing._id).set({ status: "published", publishedAt }).commit();
    } else {
      console.log(`create "${j.draft.title}" in [${categoryName}], published at ${publishedAt}`);
      if (!APPLY) continue;
      const coverAssetId = await uploadCover(j.slug, j.draft.title, categoryName);
      await client.create({
        _type: "post",
        title: j.draft.title,
        slug: { _type: "slug", current: j.slug },
        status: "published",
        isPremium: false,
        publishedAt,
        readingTime: j.draft.readingTime,
        excerpt: j.draft.excerpt,
        seoTitle: j.draft.seoTitle ?? j.draft.title,
        seoDescription: j.draft.excerpt,
        author: { _type: "reference", _ref: MILOS_AUTHOR_ID },
        categories: [{ _type: "reference", _ref: categoryId, _key: k() }],
        content: j.content,
        featuredImage: {
          _type: "image",
          asset: { _type: "reference", _ref: coverAssetId },
          alt: j.draft.title,
        },
      });
    }
  }
  if (APPLY) {
    for (const j of todo) await verifyLive(j.slug);
    if (todo.length > 0) await pingIndexNow(todo.map((j) => `${SITE}/blog/${j.slug}`));
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
