"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { COMMENT_MAX, type PublicComment } from "@/lib/comments";

type Load = { state: "idle" | "loading" | "error" } | { state: "ready"; comments: PublicComment[] };

const when = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * Comments under an article. Nothing is fetched until the reader scrolls
 * near the section, so the article itself never waits on the database.
 * Reading is open to everyone; writing needs a Google or GitHub sign-in.
 */
export default function Comments({ slug }: { slug: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const [load, setLoad] = useState<Load>({ state: "idle" });
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const root = useRef<HTMLElement>(null);

  const fetchComments = useCallback(async () => {
    setLoad({ state: "loading" });
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

  const signedIn = sessionStatus === "authenticated";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/comments/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; error?: string };
      if (!res.ok) {
        setNotice({ kind: "error", text: data.error ?? "The comment could not be sent. Try again." });
        return;
      }
      setDraft("");
      setNotice({
        kind: "ok",
        text:
          data.status === "PENDING"
            ? "Thanks. Your comment will appear once it is approved; after your first approved comment, the next ones go live straight away."
            : "Thanks, your comment is live.",
      });
      await fetchComments();
    } catch {
      setNotice({ kind: "error", text: "Network error. Your text is still here; try again." });
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/comments/${slug}/${id}`, { method: "DELETE" });
    if (res.ok) await fetchComments();
  }

  async function report(id: string) {
    const res = await fetch(`/api/comments/${slug}/${id}`, { method: "POST" });
    if (res.ok) setNotice({ kind: "ok", text: "Thanks, the comment was reported and will be looked at." });
  }

  const comments = load.state === "ready" ? load.comments : [];
  const loginHref = `/login?callbackUrl=${encodeURIComponent(`/blog/${slug}#comments`)}`;

  return (
    <section id="comments" ref={root} aria-labelledby="comments-heading" className="scroll-mt-24 border-t border-border pt-10">
      <h2 id="comments-heading" className="text-2xl font-bold tracking-tight text-foreground">
        Comments{load.state === "ready" && comments.length > 0 ? ` (${comments.filter((c) => !c.pending).length})` : ""}
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
      {load.state === "ready" && comments.length === 0 && (
        <p className="mt-4 text-sm text-muted">No comments yet. Questions, corrections and your own experience are welcome.</p>
      )}

      {comments.length > 0 && (
        <ol className="mt-6 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className={`rounded-xl border p-4 ${c.pending ? "border-dashed border-border" : "border-border bg-surface"}`}>
              <div className="flex items-center gap-3">
                {c.author.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- a 32 px avatar from Google or GitHub
                  <img src={c.author.image} alt="" width={32} height={32} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent" aria-hidden="true">
                    {c.author.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <p className="text-sm font-semibold text-foreground">{c.author.name}</p>
                <time dateTime={c.createdAt} className="text-xs text-muted-foreground">
                  {when(c.createdAt)}
                </time>
                {c.pending && <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted-foreground">Waiting for approval</span>}
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground">{c.body}</p>
              {signedIn && (
                <div className="mt-2 flex gap-4 text-xs">
                  {c.mine ? (
                    <button type="button" onClick={() => void remove(c.id)} className="min-h-8 text-muted-foreground hover:text-red-400">
                      Delete
                    </button>
                  ) : (
                    !c.pending && (
                      <button type="button" onClick={() => void report(c.id)} className="min-h-8 text-muted-foreground hover:text-foreground">
                        Report
                      </button>
                    )
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`mt-6 text-sm ${notice.kind === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {notice.text}
        </p>
      )}

      {signedIn ? (
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="comment-body" className="text-sm font-medium text-foreground">
            Comment as {session?.user?.name ?? "you"}
          </label>
          <textarea
            id="comment-body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            required
            minLength={2}
            maxLength={COMMENT_MAX}
            rows={4}
            className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-foreground outline-none focus:border-accent/60"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Plain text. Be kind; comments that break the{" "}
              <Link href="/terms#comments" className="underline underline-offset-2">
                rules
              </Link>{" "}
              are removed.
            </p>
            <button
              type="submit"
              disabled={sending || draft.trim().length < 2}
              className="min-h-11 rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Post comment"}
            </button>
          </div>
        </form>
      ) : (
        sessionStatus !== "loading" && (
          <p className="mt-6 text-sm text-muted">
            <Link href={loginHref} className="font-semibold text-accent underline underline-offset-2">
              Sign in with Google or GitHub
            </Link>{" "}
            to join the conversation.
          </p>
        )
      )}
    </section>
  );
}
