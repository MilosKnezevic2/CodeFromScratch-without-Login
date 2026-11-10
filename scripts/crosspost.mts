/**
 * Cross-posts one PUBLISHED article to dev.to, with canonical_url pointing at
 * codefromscratch.org so Google keeps crediting the original.
 *
 *   npx tsx scripts/crosspost.mts <slug>              (writes brand-brain/promo/<slug>/devto.md, sends nothing)
 *   npx tsx scripts/crosspost.mts <slug> --devto      (creates or updates a dev.to DRAFT on the operator's account)
 *   npx tsx scripts/crosspost.mts <slug> --devto --publish
 *                                                     (makes it public; refused in the first 48 hours after our
 *                                                      publish so Google indexes the original first)
 *
 * Needs DEVTO_API_KEY in .env.local for --devto (dev.to > Settings > Extensions > API keys).
 * The dev.to article id is kept in brand-brain/promo/crosspost.json, so a re-run
 * updates the same article instead of creating a duplicate.
 */
import { createClient } from "@sanity/client";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { devtoTags, toMarkdown, type ContentBlock } from "@/lib/crosspost/markdown";

for (const file of [".env.local", ".env"]) {
  let text = "";
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (m) process.env[m[1]] ??= m[2].replace(/^"|"$/g, "");
  }
}

const SITE = "https://codefromscratch.org";
const LEDGER = join("brand-brain", "promo", "crosspost.json");
const HOLD_MS = 48 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const toDevto = args.includes("--devto");
const publish = args.includes("--publish");

if (!slug) {
  console.error("usage: npx tsx scripts/crosspost.mts <slug> [--devto [--publish]]");
  process.exit(2);
}
if (publish && !toDevto) {
  console.error("--publish only makes sense together with --devto");
  process.exit(2);
}

interface Post {
  title: string;
  slug: string;
  excerpt?: string;
  seoDescription?: string;
  status?: string;
  publishedAt?: string;
  difficulty?: string;
  tags?: (string | null)[];
  cover?: string;
  content?: ContentBlock[];
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  perspective: "published",
});

const post = await sanity.fetch<Post | null>(
  `*[_type == "post" && slug.current == $slug][0]{
    title, "slug": slug.current, excerpt, seoDescription, status, publishedAt, difficulty,
    "tags": tags[]->slug.current,
    "cover": featuredImage.asset->url,
    content[]{..., _type == "image" => {..., "url": asset->url}}
  }`,
  { slug },
);

if (!post) {
  console.error(`No article with slug "${slug}" in Sanity.`);
  process.exit(1);
}
if (post.status !== "published" || !post.publishedAt || Date.parse(post.publishedAt) > Date.now()) {
  console.error(`"${slug}" is not live on the site yet (status ${post.status ?? "?"}); cross-post only live articles.`);
  process.exit(1);
}

const articleUrl = `${SITE}/blog/${post.slug}`;
const body = toMarkdown(post.content ?? [], { siteUrl: SITE, articleUrl, target: "devto" });
const footer = [
  "---",
  "",
  `_This article first appeared on [CodeFromScratch](${articleUrl}), where the live demos run right in the page. If you want the next one in your inbox, [join the newsletter](${SITE}/newsletter)._`,
  "",
].join("\n");
const markdown = `${body}\n${footer}`;
const tags = devtoTags(post.tags?.filter((t): t is string => Boolean(t)) ?? [], post.difficulty);
const description = (post.seoDescription || post.excerpt || "").slice(0, 250);

const outFile = join("brand-brain", "promo", post.slug, "devto.md");
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  [
    `<!-- title: ${post.title}`,
    `     canonical_url: ${articleUrl}`,
    `     tags: ${tags.join(", ")}`,
    `     cover: ${post.cover ?? "(none)"}`,
    `     description: ${description} -->`,
    "",
    markdown,
  ].join("\n"),
);

console.log(`Markdown: ${outFile} (${markdown.split(/\s+/).length} words)`);
console.log(`Tags: ${tags.join(", ")}  |  canonical: ${articleUrl}`);

if (!toDevto) {
  console.log("Dry run: nothing sent. Add --devto to create a dev.to draft.");
  process.exit(0);
}

const apiKey = process.env.DEVTO_API_KEY;
if (!apiKey) {
  console.error("DEVTO_API_KEY is not set in .env.local (dev.to > Settings > Extensions > DEV Community API Keys).");
  process.exit(2);
}

const age = Date.now() - Date.parse(post.publishedAt);
if (publish && age < HOLD_MS) {
  const hours = Math.ceil((HOLD_MS - age) / 3_600_000);
  console.error(`Too early to publish on dev.to: wait ${hours} more hour(s) so Google indexes the original first. A draft is fine now.`);
  process.exit(1);
}

type Ledger = Record<string, { devto?: { id: number; url: string; published: boolean; updatedAt: string } }>;
let ledger: Ledger = {};
try {
  ledger = JSON.parse(readFileSync(LEDGER, "utf8")) as Ledger;
} catch (err) {
  if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
}
const existing = ledger[post.slug]?.devto;

const article = {
  title: post.title,
  body_markdown: markdown,
  published: publish || Boolean(existing?.published),
  tags,
  canonical_url: articleUrl,
  description,
  ...(post.cover ? { main_image: post.cover } : {}),
};

const res = await fetch(existing ? `https://dev.to/api/articles/${existing.id}` : "https://dev.to/api/articles", {
  method: existing ? "PUT" : "POST",
  headers: {
    "api-key": apiKey,
    "content-type": "application/json",
    accept: "application/vnd.forem.api-v1+json",
  },
  body: JSON.stringify({ article }),
  signal: AbortSignal.timeout(20_000),
});

const text = await res.text();
if (!res.ok) {
  console.error(`dev.to refused the article: HTTP ${res.status}\n${text.slice(0, 500)}`);
  process.exit(1);
}

const data: unknown = JSON.parse(text);
if (
  typeof data !== "object" ||
  data === null ||
  typeof (data as { id?: unknown }).id !== "number" ||
  typeof (data as { url?: unknown }).url !== "string"
) {
  console.error(`dev.to answered without an article id/url: ${text.slice(0, 300)}`);
  process.exit(1);
}
const { id, url } = data as { id: number; url: string };

ledger[post.slug] = {
  ...ledger[post.slug],
  devto: { id, url, published: article.published, updatedAt: new Date().toISOString() },
};
writeFileSync(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);

console.log(`${existing ? "Updated" : "Created"} on dev.to (${article.published ? "PUBLIC" : "draft"}): ${url}`);
if (!article.published) console.log("Drafts are visible only to the account owner: dev.to > Dashboard.");
