import { createClient, type SanityClient } from "next-sanity";
import { slugify } from "@/lib/portable-text-utils";
import type { BodyBlock } from "@/lib/writer/body";

/**
 * The Writer desk's only door into Sanity, server side, with the project's
 * write token. Authors never get a Sanity login or token: they reach this
 * through the image upload (their own editable draft only) and the editor's
 * Approve button (admin only). Import it only from server code (route
 * handlers, server actions); the token is a server-only environment variable.
 */

// Vercel functions take request bodies up to 4.5 MB; 4 MB leaves room for the form wrapping.
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;

type ImageKind = { mime: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; ext: string };

/** The real type of an uploaded file, read from its first bytes; the browser's claim is not trusted. SVG is never accepted. */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  const at = (i: number, ...v: number[]) => v.every((b, j) => bytes[i + j] === b);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return { mime: "image/png", ext: "png" };
  if (at(0, 0xff, 0xd8, 0xff)) return { mime: "image/jpeg", ext: "jpg" };
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return { mime: "image/webp", ext: "webp" };
  if (at(0, 0x47, 0x49, 0x46, 0x38)) return { mime: "image/gif", ext: "gif" };
  return null;
}

let cached: SanityClient | null = null;

function writeClient(): SanityClient {
  const token = process.env.SANITY_API_TOKEN;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!token || !projectId) throw new Error("writer: Sanity write access is not configured (SANITY_API_TOKEN)");
  cached ??= createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: "2024-01-01",
    useCdn: false,
    token,
  });
  return cached;
}

/** Stores an author's image in the Sanity media library; returns the asset id the article will reference. */
export async function uploadImage(bytes: Uint8Array, kind: ImageKind, label: string): Promise<string> {
  const asset = await writeClient().assets.upload("image", Buffer.from(bytes), {
    contentType: kind.mime,
    filename: `writer-${label}.${kind.ext}`,
  });
  return asset._id;
}

export function sanityPostId(draftId: string): string {
  return `writer-${draftId}`;
}

export function studioUrl(draftId: string): string {
  return `/portal-cfs-admin/studio/intent/edit/id=${sanityPostId(draftId)};type=post`;
}

type ApprovedDraft = { id: string; title: string; excerpt: string; body: BodyBlock[] };
type DraftAuthor = { id: string; name: string | null };

/** The Sanity documents an approved draft becomes: the author's profile (if new) and an unpublished post. */
export function approvalDocuments(draft: ApprovedDraft, author: DraftAuthor) {
  const authorId = `author-writer-${author.id}`;
  const name = author.name?.trim() || "Guest author";
  return {
    author: { _id: authorId, _type: "author" as const, name, slug: { _type: "slug" as const, current: slugify(name) } },
    post: {
      _id: `drafts.${sanityPostId(draft.id)}`,
      _type: "post" as const,
      title: draft.title,
      slug: { _type: "slug" as const, current: slugify(draft.title).slice(0, 96) },
      excerpt: draft.excerpt,
      content: draft.body,
      author: { _type: "reference" as const, _ref: authorId },
      status: "draft" as const,
    },
  };
}

/**
 * Creates the article in Sanity as an unpublished draft, next to the editor's
 * own drafts, for the usual checks (category, cover image) and the publish
 * step. Never overwrites: a second approval leaves the existing documents,
 * including any edits already made in the Studio, alone.
 */
export async function createSanityDraft(draft: ApprovedDraft, author: DraftAuthor): Promise<void> {
  const docs = approvalDocuments(draft, author);
  await writeClient().transaction().createIfNotExists(docs.author).createIfNotExists(docs.post).commit();
}
