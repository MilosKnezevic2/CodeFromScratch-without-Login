"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildThreads, COMMENT_MAX, flattenThread, threadRoots, type CommentNode, type PublicComment } from "@/lib/comments";

type Load = { state: "idle" | "loading" | "error" } | { state: "ready"; comments: PublicComment[] };
type Notice = { kind: "ok" | "error"; text: string } | null;

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const PENDING_TEXT =
  "Thanks. Your comment will appear once it is approved; after your first approved comment, the next ones go live straight away.";

function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: 20 | 32 }) {
  const box = size === 20 ? "h-5 w-5 text-[9px]" : "h-8 w-8 text-xs";
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a small avatar from the sign-in provider or our own /api/avatar
    <img src={image} alt="" width={size} height={size} referrerPolicy="no-referrer" className={`${box} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-accent/15 font-bold text-accent`} aria-hidden="true">
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/** The text box for a new comment or a reply. Keeps its own draft so a failed send loses nothing. */
function Composer({
  slug,
  parentId,
  label,
  autoFocus,
  onDone,
  onCancel,
}: {
  slug: string;
  parentId: string | null;
  label: string;
  autoFocus?: boolean;
  onDone: (status: string) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = `comment-body-${parentId ?? "new"}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft, parentId }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "The comment could not be sent. Try again.");
        return;
      }
      setDraft("");
      onDone(data.status ?? "APPROVED");
    } catch {
      setError("Network error. Your text is still here; try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        required
        minLength={2}
        maxLength={COMMENT_MAX}
        rows={parentId ? 3 : 4}
        // Opens right where the reader clicked Reply.
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-accent/60"
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 px-3 text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={sending || draft.trim().length < 2}
          className="min-h-11 rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          {sending ? "Sending…" : parentId ? "Post reply" : "Post comment"}
        </button>
      </div>
    </form>
  );
}

/**
 * Comments under an article, as threads. Each top-level comment opens a
 * thread; all its replies, however deep, sit one step indented, oldest
 * first, and a reply to a reply names whom it answers. A thread's replies
 * stay folded behind "Show N replies" so one long discussion does not bury
 * the rest; a link to a comment, or a reply just written, opens its thread.
 * Nothing is fetched until the reader scrolls near the section, so the
 * article never waits on the database.
 */
export default function Comments({ slug }: { slug: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  // Threads the reader opened or closed themselves; the rest follow the defaults below.
  const [toggled, setToggled] = useState<Map<string, boolean>>(() => new Map());
  const root = useRef<HTMLElement>(null);
  const signedIn = sessionStatus === "authenticated";

  const fetchComments = useCallback(async () => {
    setLoad((prev) => (prev.state === "ready" ? prev : { state: "loading" }));
    try {
      const res = await fetch(`/api/comments/${slug}`, { cache: "no-store" });
      const data = (await res.json()) as { comments?: PublicComment[] };
      setLoad(res.ok ? { state: "ready", comments: data.comments ?? [] } : { state: "error" });
    } catch {
      setLoad({ state: "error" });
    }
  }, [slug]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          void fetchComments();
        }
      },
      // A link to one comment (a reply email) loads the list at once, wherever it is on the page.
      { rootMargin: window.location.hash.startsWith("#comment-") ? "100000px 0px" : "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchComments]);

  const comments = useMemo(() => (load.state === "ready" ? load.comments : []), [load]);
  const threads = useMemo(() => buildThreads(comments), [comments]);
  const rootOf = useMemo(() => threadRoots(threads), [threads]);
  // A link to one comment (a reply email) opens the thread it sits in.
  const linkedRoot = useMemo(
    () => (load.state === "ready" && window.location.hash.startsWith("#comment-") ? rootOf.get(window.location.hash.slice("#comment-".length)) : undefined),
    [load.state, rootOf],
  );
  const isOpen = (rootId: string) => toggled.get(rootId) ?? rootId === linkedRoot;
  const setOpen = (rootId: string, open: boolean) => setToggled((prev) => new Map(prev).set(rootId, open));

  // After a link to one comment loads the list (and opens its thread), scroll to that comment.
  useEffect(() => {
    if (load.state !== "ready" || !window.location.hash.startsWith("#comment-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [load.state]);
  const published = comments.filter((c) => !c.pending).length;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/blog/${slug}#comments`)}`;

  async function sent(status: string) {
    // A reply just written stays in sight: its thread opens.
    const thread = replyTo ? rootOf.get(replyTo) : undefined;
    if (thread) setOpen(thread, true);
    setReplyTo(null);
    setNotice({ kind: "ok", text: status === "PENDING" ? PENDING_TEXT : "Thanks, it is live." });
    await fetchComments();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments/${slug}/${id}`, { method: "DELETE" });
    if (res.ok) await fetchComments();
  }

  async function report(id: string) {
    const res = await fetch(`/api/comments/${slug}/${id}`, { method: "POST" });
    if (res.ok) setNotice({ kind: "ok", text: "Thanks, the comment was reported and will be looked at." });
  }

  function renderComment(node: CommentNode, replyingTo: string | null): React.ReactNode {
    return (
      <article
        aria-label={node.removed ? "Removed comment" : `Comment by ${node.author.name}`}
        className={`rounded-xl border p-4 ${
          node.removed
            ? "border-dashed border-border/60"
            : node.pending
              ? "border-dashed border-border"
              : "border-border bg-surface"
        }`}
      >
        {node.removed ? (
          <p className="text-sm italic text-muted-foreground">This comment was removed.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Avatar name={node.author.name} image={node.author.image} />
              <p className="text-sm font-semibold text-foreground">{node.author.name}</p>
              <time dateTime={node.createdAt} className="text-xs text-muted-foreground">
                {when(node.createdAt)}
              </time>
              {node.pending && (
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">Waiting for approval</span>
              )}
            </div>
            {replyingTo && <p className="mt-2 text-xs text-muted-foreground">↳ replying to {replyingTo}</p>}
            <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground">{node.body}</p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs">
              {!node.pending &&
                (signedIn ? (
                  <button
                    type="button"
                    onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}
                    aria-expanded={replyTo === node.id}
                    className="min-h-8 font-semibold text-accent hover:underline"
                  >
                    Reply
                  </button>
                ) : (
                  <Link href={loginHref} className="inline-flex min-h-8 items-center font-semibold text-accent hover:underline">
                    Reply
                  </Link>
                ))}
              {signedIn &&
                (node.mine ? (
                  <button type="button" onClick={() => void remove(node.id)} className="min-h-8 text-muted-foreground hover:text-red-400">
                    Delete
                  </button>
                ) : (
                  !node.pending && (
                    <button type="button" onClick={() => void report(node.id)} className="min-h-8 text-muted-foreground hover:text-foreground">
                      Report
                    </button>
                  )
                ))}
            </div>
            {replyTo === node.id && (
              <Composer
                slug={slug}
                parentId={node.id}
                label={`Reply to ${node.author.name}`}
                autoFocus
                onDone={(status) => void sent(status)}
                onCancel={() => setReplyTo(null)}
              />
            )}
          </>
        )}
      </article>
    );
  }

  function renderThread(root: CommentNode): React.ReactNode {
    const replies = flattenThread(root);
    const open = isOpen(root.id);
    const label = `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`;
    return (
      <li key={root.id} id={`comment-${root.id}`} className="scroll-mt-24">
        {renderComment(root, null)}
        {replies.length > 0 && (
          <div className="ml-3 mt-2 sm:ml-5">
            <button
              type="button"
              onClick={() => setOpen(root.id, !open)}
              aria-expanded={open}
              aria-controls={`replies-${root.id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
              {open ? "Hide replies" : `Show ${label}`}
              {!open && (
                <span aria-hidden="true" className="flex -space-x-1.5">
                  {[...new Map(replies.map((r) => [r.node.author.name, r.node.author])).values()].slice(0, 3).map((a) => (
                    <span key={a.name} className="rounded-full ring-2 ring-background">
                      <Avatar name={a.name} image={a.image} size={20} />
                    </span>
                  ))}
                </span>
              )}
            </button>
            {open && (
              <ol id={`replies-${root.id}`} className="mt-2 space-y-3 border-l-2 border-border pl-3 sm:pl-5">
                {replies.map((r) => (
                  <li key={r.node.id} id={`comment-${r.node.id}`} className="scroll-mt-24">
                    {renderComment(r.node, r.replyingTo)}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </li>
    );
  }

  return (
    <section id="comments" ref={root} aria-labelledby="comments-heading" className="scroll-mt-24 border-t border-border pt-10">
      <h2 id="comments-heading" className="text-2xl font-bold tracking-tight text-foreground">
        Comments{published > 0 ? ` (${published})` : ""}
      </h2>

      {load.state === "error" && (
        <p className="mt-4 text-sm text-muted">
          Comments could not be loaded.{" "}
          <button type="button" onClick={() => void fetchComments()} className="text-accent underline underline-offset-2">
            Try again
          </button>
        </p>
      )}
      {(load.state === "idle" || load.state === "loading") && (
        <div className="mt-6 space-y-3" aria-hidden="true">
          <div className="h-16 animate-pulse rounded-xl bg-surface" />
          <div className="h-16 animate-pulse rounded-xl bg-surface" />
        </div>
      )}
      {load.state === "ready" && threads.length === 0 && (
        <p className="mt-4 text-sm text-muted">No comments yet. Questions, corrections and your own experience are welcome.</p>
      )}

      {threads.length > 0 && <ol className="mt-6 space-y-5">{threads.map((n) => renderThread(n))}</ol>}

      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-6 text-sm ${notice.kind === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {notice.text}
        </p>
      )}

      {signedIn ? (
        <div className="mt-8">
          <Composer
            slug={slug}
            parentId={null}
            label={`Comment as ${session?.user?.name ?? "you"}`}
            onDone={(status) => void sent(status)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Plain text. Be kind; comments that break the{" "}
            <Link href="/terms#comments" className="underline underline-offset-2">
              rules
            </Link>{" "}
            are removed.
          </p>
        </div>
      ) : (
        sessionStatus !== "loading" && (
          <p className="mt-6 text-sm text-muted">
            <Link href={loginHref} className="font-semibold text-accent underline underline-offset-2">
              Log in or sign up
            </Link>{" "}
            with Google, GitHub or your email address to join the conversation.
          </p>
        )
      )}
    </section>
  );
}
