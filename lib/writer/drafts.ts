import { prisma } from "@/lib/prisma";
import { currentReader } from "@/lib/comments-store";

/**
 * The Writer desk's rules, in one place:
 *  - only a signed-in, not banned user with the AUTHOR role is an author;
 *  - an author only ever reads and changes their own drafts (every query
 *    below carries authorId);
 *  - an author edits only WRITING and CHANGES_REQUESTED drafts, and the only
 *    move they can make is "send for review";
 *  - nothing here can publish: publishing is the editor's, from the admin.
 */

export const LIMITS = { title: 120, excerpt: 300, markdown: 100_000, openDrafts: 20 } as const;
export const EDITABLE = ["WRITING", "CHANGES_REQUESTED"] as const;

export type Author = { id: string; name: string | null };

/** The signed-in author, or null for everyone else (readers, banned users, no session). */
export async function currentAuthor(): Promise<Author | null> {
  const reader = await currentReader();
  if (!reader) return null;
  const user = await prisma.user.findUnique({ where: { id: reader.id }, select: { role: true } });
  return user?.role === "AUTHOR" ? { id: reader.id, name: reader.name } : null;
}

export type DraftInput = { title: string; excerpt: string; markdown: string };

/** Checks what the editor sends; trims and limits every field. */
export function parseDraftInput(raw: unknown): { ok: true; value: DraftInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Nothing to save." };
  const r = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const title = str(r.title).trim();
  const excerpt = str(r.excerpt).trim();
  const markdown = str(r.markdown);
  if (title.length > LIMITS.title) return { ok: false, error: `The title can be at most ${LIMITS.title} characters.` };
  if (excerpt.length > LIMITS.excerpt) return { ok: false, error: `The summary can be at most ${LIMITS.excerpt} characters.` };
  if (markdown.length > LIMITS.markdown) return { ok: false, error: "The article is too long to save in one draft." };
  return { ok: true, value: { title, excerpt, markdown } };
}

/** What a draft needs before the editor sees it. */
export function readyForReview(d: DraftInput): string | null {
  if (d.title.length < 10) return "Give the article a title of at least 10 characters.";
  if (d.excerpt.length < 40) return "Write a one- or two-sentence summary (at least 40 characters).";
  if (d.markdown.trim().length < 1500) return "The article is still very short; write a bit more before sending it.";
  return null;
}

export function listOwnDrafts(authorId: string) {
  return prisma.articleDraft.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, updatedAt: true, submittedAt: true, reviewNote: true },
  });
}

export function getOwnDraft(authorId: string, id: string) {
  return prisma.articleDraft.findFirst({ where: { id, authorId } });
}

export async function createOwnDraft(authorId: string): Promise<{ id: string } | { error: string }> {
  const open = await prisma.articleDraft.count({ where: { authorId, status: { in: [...EDITABLE] } } });
  if (open >= LIMITS.openDrafts) return { error: "You already have many open drafts. Finish or delete one first." };
  return prisma.articleDraft.create({ data: { authorId }, select: { id: true } });
}

/** Saves only an own draft that is still editable; false when it is not (locked in review, or not theirs). */
export async function saveOwnDraft(authorId: string, id: string, input: DraftInput): Promise<boolean> {
  const { count } = await prisma.articleDraft.updateMany({
    where: { id, authorId, status: { in: [...EDITABLE] } },
    data: input,
  });
  return count === 1;
}

export async function submitOwnDraft(authorId: string, id: string): Promise<{ ok: true; title: string } | { error: string }> {
  const draft = await prisma.articleDraft.findFirst({ where: { id, authorId, status: { in: [...EDITABLE] } } });
  if (!draft) return { error: "This draft cannot be sent: it is already with the editor, or it is not yours." };
  const problem = readyForReview(draft);
  if (problem) return { error: problem };
  const { count } = await prisma.articleDraft.updateMany({
    where: { id, authorId, status: { in: [...EDITABLE] } },
    data: { status: "IN_REVIEW", submittedAt: new Date() },
  });
  return count === 1 ? { ok: true, title: draft.title } : { error: "This draft was changed in the meantime. Reload and try again." };
}

export async function deleteOwnDraft(authorId: string, id: string): Promise<boolean> {
  const { count } = await prisma.articleDraft.deleteMany({ where: { id, authorId, status: "WRITING" } });
  return count === 1;
}
