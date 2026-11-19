/**
 * Puts a guest author's article into Sanity as an unpublished draft, with the
 * author's own profile, images and words. Nothing is rewritten: the Markdown
 * template (brand-brain/guest-authors/) is only translated into the site's
 * blocks by scripts/lib/guest-article.ts.
 *
 *   npx tsx scripts/import-guest-post.mts <folder | article.md> --category "Name"
 *     (dry run: checks the article and the images, shows what would be created)
 *   ... --apply             creates the author profile (first article only) and the draft
 *   ... --apply --replace   a corrected version: replaces the text of the same,
 *                           still unpublished article; Studio fields stay
 *
 * The folder is what the author sent: one .md file and the images it links to.
 * After the operator's review in the Studio, publish as usual:
 *   node scripts/publish-post.mjs <slug> --apply
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { calculateReadingTime } from "../lib/reading-time";
import { uploadCover } from "./lib/cover.mjs";
import { convertGuestArticle, imageKind, slugify, type ImageBlock } from "./lib/guest-article";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(here, "..", ".env.local"), quiet: true });

const SITE = "https://codefromscratch.org";
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" } as const;

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const APPLY = args.includes("--apply");
const REPLACE = args.includes("--replace");
const target = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--category");

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

if (!target) fail('usage: npx tsx scripts/import-guest-post.mts <folder | article.md> --category "Name" [--apply] [--replace]');
if (!process.env.SANITY_API_TOKEN) fail("SANITY_API_TOKEN is not set in .env.local");

/** The article file: the given .md, or the only .md in the folder (article.md wins). */
function findArticle(path: string): string {
  const full = resolve(path);
  if (!existsSync(full)) fail(`${path} does not exist`);
  if (statSync(full).isFile()) return full;
  const mds = readdirSync(full).filter((f) => extname(f).toLowerCase() === ".md");
  if (mds.includes("article.md")) return join(full, "article.md");
  if (mds.length === 1) return join(full, mds[0]);
  fail(mds.length ? `${path} has several .md files (${mds.join(", ")}); name the article file` : `${path} has no .md file`);
}

type LoadedImage = { file: string; bytes: Buffer; kind: keyof typeof MIME; width: number; height: number };

/** Reads an image the article links to, only from inside the author's folder. */
async function loadImage(root: string, src: string, errors: string[], label: string): Promise<LoadedImage | null> {
  let decoded = src;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    // A literal % in the file name: use the path as written.
  }
  const file = resolve(root, decoded);
  const rel = relative(root, file);
  if (!rel || rel.startsWith("..") || isAbsolute(rel) || /^[a-z]+:/i.test(decoded)) {
    errors.push(`${label}: "${src}" must be a file inside the article folder.`);
    return null;
  }
  if (!existsSync(file)) {
    errors.push(`${label}: ${rel} is missing from the folder.`);
    return null;
  }
  const bytes = readFileSync(file);
  if (bytes.length > IMAGE_MAX_BYTES) {
    errors.push(`${label}: ${rel} is ${(bytes.length / 1048576).toFixed(1)} MB (at most 10 MB).`);
    return null;
  }
  const kind = imageKind(bytes);
  if (!kind) {
    errors.push(`${label}: ${rel} is not a PNG, JPEG, WebP or GIF image.`);
    return null;
  }
  const { width = 0, height = 0 } = await sharp(bytes).metadata();
  return { file: rel, bytes, kind, width, height };
}

async function main() {
  const articleFile = findArticle(target!);
  const root = dirname(articleFile);
  const result = convertGuestArticle(readFileSync(articleFile, "utf8"));
  const { meta, content, errors, warnings } = result;

  const images = new Map<string, LoadedImage>();
  for (const { key, src } of result.images) {
    const img = await loadImage(root, src, errors, "image");
    if (!img) continue;
    images.set(key, img);
    if (img.width < 1200 && img.kind !== "gif") warnings.push(`${img.file} is ${img.width} px wide (the guide asks for at least 1200).`);
  }
  let photo: LoadedImage | null = null;
  if (meta?.author.photo) {
    photo = await loadImage(root, meta.author.photo, errors, "author.photo");
    if (photo && (photo.width < 400 || Math.abs(photo.width - photo.height) > photo.width * 0.1)) {
      warnings.push(`author photo is ${photo.width} x ${photo.height} (best square, at least 400 x 400).`);
    }
  } else if (meta) warnings.push("No author photo.");

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  });

  const slug = meta ? slugify(meta.title) : "";
  const authorSlug = meta ? slugify(meta.author.name) : "";
  const authorId = `author-guest-${authorSlug}`;
  const [existingPost, existingAuthor, sameName, tags] = await Promise.all([
    client.fetch<{ _id: string; status?: string; author?: string } | null>(
      `*[_type == "post" && slug.current == $slug][0]{_id, status, "author": author._ref}`,
      { slug },
    ),
    client.fetch<{ _id: string; name: string } | null>(`*[_id == $id][0]{_id, name}`, { id: authorId }),
    client.fetch<{ _id: string }[]>(`*[_type == "author" && name == $name && _id != $id]{_id}`, { name: meta?.author.name ?? "", id: authorId }),
    client.fetch<{ _id: string; slug: string; title: string }[]>(`*[_type == "tag"]{_id, "slug": slug.current, title}`),
  ]);

  if (existingPost) {
    if (existingPost.status === "published") errors.push(`"${slug}" is already published; change it in the Studio instead.`);
    else if (!REPLACE) errors.push(`"${slug}" is already in Sanity as a draft. Use --replace to put in a corrected version.`);
    else if (existingPost.author !== authorId) errors.push(`"${slug}" in Sanity belongs to another author; not replaced.`);
  }
  if (sameName.length) warnings.push(`Another author profile already has the name "${meta?.author.name}" (${sameName.map((a) => a._id).join(", ")}).`);

  const categoryName = flag("category");
  let categoryId: string | null = null;
  if (!existingPost) {
    if (!categoryName) errors.push('A new article needs --category "<existing category title>".');
    else {
      categoryId = await client.fetch<string | null>(`*[_type == "category" && title == $t][0]._id`, { t: categoryName });
      if (!categoryId) errors.push(`Category "${categoryName}" does not exist in Sanity.`);
    }
  }

  const matchedTags = new Map<string, string>();
  const unknownTags: string[] = [];
  for (const wanted of meta?.tags ?? []) {
    const w = slugify(wanted);
    const tag = tags.find((t) => t.slug === w || slugify(t.title ?? "") === w);
    if (tag) matchedTags.set(tag.slug, tag._id);
    else unknownTags.push(wanted);
  }

  const counts = content.reduce<Record<string, number>>((acc, b) => ((acc[b._type] = (acc[b._type] ?? 0) + 1), acc), {});
  const readingTime = calculateReadingTime(content);
  console.log(`${APPLY ? "APPLY" : "DRY RUN"} - ${relative(process.cwd(), articleFile)}\n`);
  if (meta) {
    console.log(`title:     ${meta.title}`);
    console.log(`slug:      ${slug}${existingPost ? ` (replaces ${existingPost._id})` : ""}`);
    console.log(`author:    ${meta.author.name} -> ${authorId} (${existingAuthor ? "profile exists, kept as it is" : "new profile"})`);
    console.log(`category:  ${existingPost ? "(kept)" : categoryName ?? "-"}`);
    console.log(`tags:      ${[...matchedTags.keys()].join(", ") || "-"}${unknownTags.length ? `   (no such tag: ${unknownTags.join(", ")})` : ""}`);
    console.log(`reading:   ${readingTime} min, difficulty ${meta.difficulty ?? "-"}`);
    console.log(`blocks:    ${Object.entries(counts).map(([t, n]) => `${t} ${n}`).join(", ")}`);
    for (const [, img] of images) console.log(`image:     ${img.file} ${img.width}x${img.height} ${img.kind}`);
  }
  for (const w of warnings) console.log(`note:      ${w}`);
  if (errors.length || !meta) {
    console.error(`\nNOT IMPORTED, nothing was written. Fix these first:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  if (!APPLY) {
    console.log("\nAll checks passed. Run again with --apply to create the draft.");
    return;
  }

  for (const block of content) {
    if (block._type !== "image") continue;
    const img = images.get(block._key)!;
    const asset = await client.assets.upload("image", img.bytes, {
      filename: `guest-${slug}-${basename(img.file)}`,
      contentType: MIME[img.kind],
    });
    (block as ImageBlock).asset = { _type: "reference", _ref: asset._id };
  }

  if (!existingAuthor) {
    const a = meta.author;
    const photoRef = photo
      ? (await client.assets.upload("image", photo.bytes, { filename: `author-${authorSlug}.${photo.kind}`, contentType: MIME[photo.kind] }))._id
      : null;
    await client.createIfNotExists({
      _id: authorId,
      _type: "author",
      name: a.name,
      slug: { _type: "slug", current: authorSlug },
      ...(a.bio ? { bio: a.bio } : {}),
      ...(photoRef ? { image: { _type: "image", asset: { _type: "reference", _ref: photoRef } } } : {}),
      ...(a.github ? { github: a.github } : {}),
      ...(a.linkedin ? { linkedin: a.linkedin } : {}),
      ...(a.twitter ? { twitter: a.twitter } : {}),
      ...(a.website ? { website: a.website } : {}),
    });
  }

  const text = {
    title: meta.title,
    excerpt: meta.excerpt,
    seoTitle: meta.title,
    seoDescription: meta.excerpt,
    content,
    readingTime,
    ...(meta.difficulty ? { difficulty: meta.difficulty } : {}),
  };
  let postId: string;
  if (existingPost) {
    postId = existingPost._id;
    await client.patch(postId).set(text).commit();
  } else {
    postId = randomUUID();
    const coverAssetId = await uploadCover(client, slug, meta.title, categoryName);
    await client.create({
      _id: postId,
      _type: "post",
      slug: { _type: "slug", current: slug },
      status: "draft",
      isPremium: false,
      author: { _type: "reference", _ref: authorId },
      categories: [{ _type: "reference", _ref: categoryId, _key: randomUUID().slice(0, 12) }],
      tags: [...matchedTags].map(([s, id]) => ({ _type: "reference", _ref: id, _key: `tag-${s}` })),
      featuredImage: { _type: "image", asset: { _type: "reference", _ref: coverAssetId }, alt: meta.title },
      ...text,
    });
  }

  console.log(`\n${existingPost ? "Replaced" : "Created"} the draft "${meta.title}" (not published).`);
  console.log(`Studio:  ${SITE}/portal-cfs-admin/studio/intent/edit/id=${postId};type=post`);
  console.log(`Publish after review:  node scripts/publish-post.mjs ${slug} --apply`);
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
