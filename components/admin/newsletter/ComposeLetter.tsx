"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NOTE_MAX, PREHEADER_MAX, SUBJECT_MAX } from "@/lib/newsletter/input";

export interface PostOption {
  slug: string;
  title: string;
  excerpt: string;
}

type Notice = { kind: "ok" | "error"; text: string } | null;

const FIELD =
  "mt-1 block w-full rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none";

/** Resend's free plan stops at this many emails a day. */
const FREE_PLAN_DAILY_LIMIT = 100;

export default function ComposeLetter({
  posts,
  confirmedCount,
}: {
  posts: PostOption[];
  confirmedCount: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [postSlug, setPostSlug] = useState("");
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [note, setNote] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "phone">("desktop");
  const [testEmail, setTestEmail] = useState("");
  const [typedCount, setTypedCount] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "all">("");
  const [notice, setNotice] = useState<Notice>(null);

  const letter = { subject, preheader, note, postSlug };
  const ready = Boolean(subject.trim() && (postSlug || note.trim()));

  // The preview always comes from the server's real template.
  useEffect(() => {
    if (!subject.trim() || (!postSlug && !note.trim())) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/newsletter/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, preheader, note, postSlug }),
          signal: controller.signal,
        });
        const data = (await res.json()) as { html?: string; error?: string };
        if (res.ok && data.html) {
          setPreviewHtml(data.html);
        } else {
          setNotice({ kind: "error", text: data.error ?? "The preview could not be built." });
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setNotice({ kind: "error", text: "The preview could not be built." });
        }
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [subject, preheader, note, postSlug]);

  function choosePost(slug: string) {
    setPostSlug(slug);
    const post = posts.find((option) => option.slug === slug);
    if (post) {
      setSubject(post.title.slice(0, SUBJECT_MAX));
      setPreheader(post.excerpt.slice(0, PREHEADER_MAX));
    }
  }

  async function send(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...letter, ...payload }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      status?: string;
      sentCount?: number;
      failedCount?: number;
      testSentTo?: string;
    };
    return { ok: res.ok, data };
  }

  async function sendTest(event: React.FormEvent) {
    event.preventDefault();
    setBusy("test");
    setNotice(null);
    try {
      const { ok, data } = await send({ mode: "test", testEmail });
      setNotice(
        ok
          ? { kind: "ok", text: `Test sent to ${data.testSentTo}. Only that address received it.` }
          : { kind: "error", text: data.error ?? "The test email could not be sent." },
      );
    } catch {
      setNotice({ kind: "error", text: "Network error. Try again." });
    }
    setBusy("");
  }

  async function sendAll() {
    setBusy("all");
    setNotice(null);
    try {
      const { ok, data } = await send({ mode: "all", confirmCount: Number(typedCount) });
      dialogRef.current?.close();
      setTypedCount("");
      if (ok) {
        setNotice({
          kind: data.failedCount ? "error" : "ok",
          text: data.failedCount
            ? `Sent to ${data.sentCount}, failed for ${data.failedCount}. Failed addresses are not retried automatically.`
            : `Sent to ${data.sentCount} subscribers.`,
        });
        router.refresh();
      } else {
        setNotice({ kind: "error", text: data.error ?? "The letter could not be sent." });
      }
    } catch {
      dialogRef.current?.close();
      setNotice({
        kind: "error",
        text: "The connection dropped. Check Sent letters before trying again, it may have gone out.",
      });
    }
    setBusy("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-5">
        <div>
          <label htmlFor="letter-post" className="block text-sm font-medium text-muted">
            Article
          </label>
          <select
            id="letter-post"
            value={postSlug}
            onChange={(event) => choosePost(event.target.value)}
            className={`${FIELD} min-h-11`}
          >
            <option value="">No article, just a note</option>
            {posts.map((post) => (
              <option key={post.slug} value={post.slug}>
                {post.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="letter-subject" className="block text-sm font-medium text-muted">
            Subject <span aria-hidden="true">*</span>
          </label>
          <input
            id="letter-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            maxLength={SUBJECT_MAX}
            required
            aria-required="true"
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="letter-preheader" className="block text-sm font-medium text-muted">
            Preview text (the grey line next to the subject in the inbox)
          </label>
          <input
            id="letter-preheader"
            value={preheader}
            onChange={(event) => setPreheader(event.target.value)}
            maxLength={PREHEADER_MAX}
            className={FIELD}
          />
        </div>

        <div>
          <label htmlFor="letter-note" className="block text-sm font-medium text-muted">
            Your note (optional). An empty line starts a new paragraph.
          </label>
          <textarea
            id="letter-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={NOTE_MAX}
            rows={7}
            className={FIELD}
          />
        </div>

        <form onSubmit={sendTest} className="rounded-xl border border-border bg-surface p-4">
          <label htmlFor="letter-test-email" className="block text-sm font-medium text-foreground">
            1. Send yourself a test
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="letter-test-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="you@example.com"
              className="min-w-0 flex-1 basis-48 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={!ready || busy !== ""}
              className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-surface-2 disabled:opacity-50"
            >
              {busy === "test" ? "Sending…" : "Send test"}
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-sm font-medium text-foreground">2. Send to everyone</p>
          <p className="mt-1 text-sm text-muted">
            Goes to {confirmedCount} confirmed {confirmedCount === 1 ? "subscriber" : "subscribers"}.
            People waiting for confirmation get nothing.
          </p>
          {confirmedCount > FREE_PLAN_DAILY_LIMIT && (
            <p className="mt-2 text-sm text-amber-400">
              The list is larger than the {FREE_PLAN_DAILY_LIMIT} emails a day on Resend&rsquo;s free plan.
              Check the plan before sending, or the rest will fail.
            </p>
          )}
          <button
            type="button"
            disabled={!ready || busy !== "" || confirmedCount === 0}
            onClick={() => dialogRef.current?.showModal()}
            className="mt-3 min-h-11 rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            Send to everyone…
          </button>
        </div>

        <div aria-live="polite">
          {notice && (
            <p
              className={`rounded-lg border p-3 text-sm ${
                notice.kind === "ok"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {notice.text}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-muted">Preview</h2>
          <div role="group" aria-label="Preview width" className="flex gap-1">
            {(["desktop", "phone"] as const).map((width) => (
              <button
                key={width}
                type="button"
                onClick={() => setPreviewWidth(width)}
                aria-pressed={previewWidth === width}
                className={`min-h-11 rounded-lg px-3 py-1 text-xs font-medium capitalize transition ${
                  previewWidth === width ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {width}
              </button>
            ))}
          </div>
        </div>
        {ready && previewHtml ? (
          <iframe
            title="Letter preview"
            srcDoc={previewHtml}
            sandbox=""
            className="mx-auto mt-2 h-[42rem] max-w-full rounded-xl border border-border bg-white"
            style={{ width: previewWidth === "phone" ? 375 : "100%" }}
          />
        ) : (
          <div className="mt-2 rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted">
            Pick an article, or write a subject and a note, and the letter appears here.
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="send-all-title"
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-border bg-surface p-6 text-left text-foreground backdrop:bg-black/60"
      >
        <h2 id="send-all-title" className="text-lg font-bold">
          Send to {confirmedCount} {confirmedCount === 1 ? "person" : "people"}?
        </h2>
        <p className="mt-2 text-sm text-muted">
          Subject: <span className="text-foreground">{subject}</span>
        </p>
        <p className="mt-2 text-sm text-muted">Once it goes out it cannot be called back.</p>
        <label htmlFor="letter-confirm-count" className="mt-4 block text-sm font-medium text-muted">
          Type {confirmedCount} to confirm
        </label>
        <input
          id="letter-confirm-count"
          inputMode="numeric"
          autoComplete="off"
          value={typedCount}
          onChange={(event) => setTypedCount(event.target.value)}
          className={FIELD}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            disabled={busy === "all"}
            className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={sendAll}
            disabled={busy !== "" || typedCount.trim() !== String(confirmedCount)}
            className="min-h-11 rounded-lg gradient-btn px-4 py-2 text-sm font-medium transition disabled:opacity-50"
          >
            {busy === "all" ? "Sending…" : "Send now"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
