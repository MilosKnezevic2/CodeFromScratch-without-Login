/**
 * Rules for reader comments, kept free of the database so they can be tested.
 */

export const COMMENT_MIN = 2;
export const COMMENT_MAX = 2000;

/** Per reader: a burst limit and a daily cap, counted in the database (works across server instances). */
export const BURST = { count: 5, windowMs: 10 * 60 * 1000 };
export const DAILY = { count: 30, windowMs: 24 * 60 * 60 * 1000 };

/** A published comment with this many reports goes back to the moderation queue. */
export const REPORTS_TO_HIDE = 3;

const SLUG_RE = /^[a-z0-9-]{1,200}$/;

export function isPostSlug(value: unknown): value is string {
  return typeof value === "string" && SLUG_RE.test(value);
}

export type ParsedComment = { ok: true; body: string } | { ok: false; error: string };

/**
 * Plain text only: trimmed, line endings unified, runs of blank lines folded,
 * control characters removed. The page shows it as text, so markup in it is
 * just characters.
 */
export function parseCommentBody(input: unknown): ParsedComment {
  if (typeof input !== "string") return { ok: false, error: "Write something first." };
  const body = input
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (body.length < COMMENT_MIN) return { ok: false, error: "Write something first." };
  if (body.length > COMMENT_MAX) return { ok: false, error: `Keep it under ${COMMENT_MAX} characters.` };
  return { ok: true, body };
}

/** Links are the main spam signal: more than two and the comment waits for a person. */
export function linkCount(body: string): number {
  return (body.match(/https?:\/\/|www\./gi) ?? []).length;
}

/**
 * A reader's first comment is held for approval; once one of theirs has been
 * approved, later ones go live at once, unless they carry many links.
 */
export function initialStatus(hasApprovedBefore: boolean, body: string): "PENDING" | "APPROVED" {
  if (!hasApprovedBefore) return "PENDING";
  return linkCount(body) > 2 ? "PENDING" : "APPROVED";
}

export interface PublicComment {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; image: string | null };
  mine: boolean;
  pending: boolean;
}

/** What a page may show about the author: a display name and the avatar, never the email. */
export function displayName(name: string | null | undefined): string {
  const clean = (name ?? "").trim();
  return clean ? clean.slice(0, 60) : "Reader";
}
