"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildThreads, COMMENT_MAX, MAX_INDENT_DEPTH, type CommentNode, type PublicComment } from "@/lib/comments";

type Load = { state: "idle" | "loading" | "error" } | { state: "ready"; comments: PublicComment[] };
type Notice = { kind: "ok" | "error"; text: string } | null;

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const PENDING_TEXT =
  "Thanks. Your comment will appear once it is approved; after your first approved comment, the next ones go live straight away.";

function Avatar({ name, image }: { name: string; image: string | null }) {
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- a 32 px avatar from the sign-in provider
    <img src={image} alt="" width={32} height={32} referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full" />
  ) : (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent"
      aria-hidden="true"
    >
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
 * Comments under an article, as threads: a reply sits indented under the
 * comment it answers, a reply to that reply one step further, and so on.
 * Indentation stops growing after a few levels so a phone keeps a readable
 * column; deeper replies say whom they answer. Nothing is fetched until the
 * reader scrolls near the section, so the article never waits on the database.
 */
export default function Comments({ slug }: { slug: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
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
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchComments]);

  const comments = useMemo(() => (load.state === "ready" ? load.comments : []), [load]);
  const threads = useMemo(() => buildThreads(comments), [comments]);
  const published = comments.filter((c) => !c.pending).length;
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/blog/${slug}#comments`)}`;

  async function sent(status: string) {
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

  function renderNode(node: CommentNode, parentName: string | null): React.ReactNode {
    const indent = node.depth > 0 && node.depth <= MAX_INDENT_DEPTH;
    return (
      <li key={node.id} className={indent ? "ml-3 border-l-2 border-border pl-3 sm:ml-5 sm:pl-5" : ""}>
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
              {node.depth > MAX_INDENT_DEPTH && parentName && (
                <p className="mt-2 text-xs text-muted-foreground">↳ replying to {parentName}</p>
              )}
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
        {node.replies.length > 0 && (
          <ol className="mt-3 space-y-3">{node.replies.map((r) => renderNode(r, node.removed ? null : node.author.name))}</ol>
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

      {threads.length > 0 && <ol className="mt-6 space-y-4">{threads.map((n) => renderNode(n, null))}</ol>}

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
