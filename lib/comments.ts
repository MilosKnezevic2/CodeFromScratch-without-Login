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
export function initialStatus(hasApprovedBefore: boolean, body: string, holdFirst = true): "PENDING" | "APPROVED" {
  if (linkCount(body) > 2) return "PENDING";
  if (!hasApprovedBefore && holdFirst) return "PENDING";
  return "APPROVED";
}

export interface PublicComment {
  id: string;
  /** The comment this one answers, or null for a top-level comment. */
  parentId: string | null;
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

export interface CommentNode extends PublicComment {
  /** True for a removed comment kept only so its replies stay in place. */
  removed: boolean;
  depth: number;
  replies: CommentNode[];
}


/**
 * Turns the flat list into threads. A reply whose parent is not in the list
 * (removed, rejected, or not yet approved) hangs under a "removed" stand-in,
 * so a conversation never loses its context. Order within a level is the
 * order of the list (oldest first).
 */
export function buildThreads(comments: PublicComment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const c of comments) nodes.set(c.id, { ...c, removed: false, depth: 0, replies: [] });

  const roots: CommentNode[] = [];
  for (const c of comments) {
    const node = nodes.get(c.id)!;
    if (!c.parentId) {
      roots.push(node);
      continue;
    }
    let parent = nodes.get(c.parentId);
    if (!parent) {
      parent = {
        id: c.parentId,
        parentId: null,
        body: "",
        createdAt: c.createdAt,
        author: { name: "", image: null },
        mine: false,
        pending: false,
        removed: true,
        depth: 0,
        replies: [],
      };
      nodes.set(c.parentId, parent);
      roots.push(parent);
    }
    parent.replies.push(node);
  }

  const setDepth = (list: CommentNode[], depth: number) => {
    for (const n of list) {
      n.depth = depth;
      setDepth(n.replies, depth + 1);
    }
  };
  setDepth(roots, 0);
  return roots;
}

export interface ThreadReply {
  node: CommentNode;
  /** Whom this reply answers, when that is not the comment that opened the thread. */
  replyingTo: string | null;
}

/**
 * Every reply in a thread, at one level and oldest first: a page indents a
 * conversation once, however deep it goes, and names the person a reply
 * answers instead of indenting it further.
 */
export function flattenThread(root: CommentNode): ThreadReply[] {
  const out: ThreadReply[] = [];
  const walk = (parent: CommentNode) => {
    for (const reply of parent.replies) {
      out.push({ node: reply, replyingTo: parent === root || parent.removed ? null : parent.author.name });
      walk(reply);
    }
  };
  walk(root);
  return out.sort((a, b) => a.node.createdAt.localeCompare(b.node.createdAt));
}

/** Which thread (top-level comment) each comment belongs to, to open the right one for a link or a new reply. */
export function threadRoots(roots: CommentNode[]): Map<string, string> {
  const map = new Map<string, string>();
  const walk = (node: CommentNode, rootId: string) => {
    map.set(node.id, rootId);
    for (const r of node.replies) walk(r, rootId);
  };
  for (const root of roots) walk(root, root.id);
  return map;
}
