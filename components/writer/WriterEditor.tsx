"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PortableTextBlock } from "@portabletext/editor";
import { deleteDraftAction, saveDraftAction, submitDraftAction } from "@/app/dashboard/write/actions";
import { toBody, wordCount, type BodyBlock } from "@/lib/writer/body";
import { STATUS_LABEL, type DraftStatusName } from "@/lib/writer/status";
import DraftPreview from "./DraftPreview";
import RichEditor from "./editor/RichEditor";

type Props = {
  id: string;
  initial: { title: string; excerpt: string; body: BodyBlock[] };
  status: DraftStatusName;
  reviewNote: string | null;
  authorName: string;
};

type SaveState = { kind: "saved"; at: Date } | { kind: "dirty" } | { kind: "saving" } | { kind: "error"; message: string };

const AUTOSAVE_MS = 1200;
const TITLE_MAX = 120;
const EXCERPT_MAX = 300;

/**
 * The Writer desk editor: the article written in place, in the site's own
 * styles, with a full preview one tab away. Saves on its own; an author can
 * send the draft for review, never publish it.
 */
export default function WriterEditor({ id, initial, status, reviewNote, authorName }: Props) {
  const router = useRouter();
  const editable = status === "WRITING" || status === "CHANGES_REQUESTED";
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [body, setBody] = useState<PortableTextBlock[]>(initial.body);
  const [save, setSave] = useState<SaveState>({ kind: "saved", at: new Date() });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // Counts edits, so a save that finishes after newer typing does not claim "Saved".
  const version = useRef(0);

  const words = useMemo(() => wordCount(toBody(body)), [body]);

  // Every change marks the draft dirty; the effect below saves after a short pause.
  const changed =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      version.current += 1;
      setSave({ kind: "dirty" });
    };
  const changeTitle = changed(setTitle);
  const changeExcerpt = changed(setExcerpt);
  const changeBody = changed(setBody);

  // Autosave: a short pause after the last keystroke saves title, summary and text together.
  const dirty = save.kind === "dirty";
  useEffect(() => {
    if (!editable || !dirty) return;
    const timer = setTimeout(async () => {
      const savedVersion = version.current;
      setSave({ kind: "saving" });
      const result = await saveDraftAction(id, { title, excerpt, body });
      if (!result.ok) setSave({ kind: "error", message: result.error });
      else if (version.current === savedVersion) setSave({ kind: "saved", at: new Date() });
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [id, title, excerpt, body, editable, dirty]);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    const unsaved = save.kind === "dirty" || save.kind === "saving";
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save.kind]);

  async function send() {
    setSending(true);
    setSendError(null);
    const saved = await saveDraftAction(id, { title, excerpt, body });
    const result = saved.ok ? await submitDraftAction(id) : saved;
    setSending(false);
    if (!result.ok) {
      setSendError(result.error);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  async function remove() {
    const result = await deleteDraftAction(id);
    if (result.ok) router.push("/dashboard/write");
    else setSendError(result.error);
  }

  const statusInfo = STATUS_LABEL[status];
  const saveText =
    save.kind === "saving"
      ? "Saving…"
      : save.kind === "dirty"
        ? "Unsaved changes"
        : save.kind === "error"
          ? save.message
          : `Saved ${save.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="mx-auto w-full max-w-[96rem] px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      {/* Top bar */}
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Link href="/dashboard/write" className="text-sm font-semibold text-muted hover:text-foreground">
          ← Your articles
        </Link>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusInfo.tone}`}>{statusInfo.label}</span>
        <span role="status" aria-live="polite" className={`text-xs ${save.kind === "error" ? "font-semibold text-red-600 dark:text-red-300" : "text-muted-foreground"}`}>
          {editable ? saveText : "Locked while the editor has it"}
        </span>
        <span className="text-xs text-muted-foreground">{words.toLocaleString("en-GB")} words</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/write/guide" target="_blank" className="min-h-10 content-center rounded-full px-3 text-sm font-semibold text-muted hover:text-foreground">
            Guide<span className="sr-only"> (opens in a new tab)</span>
          </Link>
          {status === "WRITING" && (
            <button type="button" onClick={remove} className="min-h-10 rounded-full px-4 text-sm font-semibold text-muted hover:text-red-600">
              Delete
            </button>
          )}
          {editable && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="min-h-10 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground transition hover:opacity-90 active:scale-[0.98]"
            >
              Send for review
            </button>
          )}
        </div>
      </div>

      {confirming && (
        <div role="alertdialog" aria-labelledby="send-h" className="mt-4 rounded-2xl border border-accent/40 bg-accent/5 p-5">
          <p id="send-h" className="font-bold text-foreground">Send this article to Milos?</p>
          <p className="mt-1 text-sm text-muted">
            It locks while he reads it. It comes back with notes if anything should change; publishing is his step.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="min-h-10 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground disabled:opacity-60"
            >
              {sending ? "Sending…" : "Yes, send it"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="min-h-10 rounded-full px-4 text-sm font-semibold text-muted hover:text-foreground">
              Not yet
            </button>
          </div>
          {sendError && (
            <p role="alert" className="mt-3 text-sm font-semibold text-red-600 dark:text-red-300">
              {sendError}
            </p>
          )}
        </div>
      )}

      {status === "CHANGES_REQUESTED" && reviewNote && (
        <div className="mt-4 rounded-2xl border border-yellow-500/40 bg-yellow-500/5 p-5">
          <p className="text-sm font-bold text-foreground">Notes from the editor</p>
          <p className="mt-1 whitespace-pre-line text-sm text-muted">{reviewNote}</p>
        </div>
      )}
      {!editable && (
        <div className="mt-4 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          {status === "IN_REVIEW"
            ? "Milos is reading this article. You will get it back with notes, or he publishes it."
            : "Approved. Milos takes it from here and publishes it under your name."}
        </div>
      )}

      <div role="tablist" aria-label="Editor view" className="mx-auto mt-4 grid max-w-xs grid-cols-2 rounded-full border border-border p-1">
        {(["write", "preview"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`min-h-10 rounded-full text-sm font-bold transition ${tab === t ? "bg-accent text-accent-foreground" : "text-muted"}`}
          >
            {t === "write" ? "Write" : "Preview"}
          </button>
        ))}
      </div>

      {/* Write: title, summary and the article, edited in place. Kept mounted so undo history survives a look at the preview. */}
      <section aria-label="Write" className={`${tab === "write" ? "" : "hidden"} mx-auto mt-6 max-w-4xl`}>
        <label htmlFor="wd-title" className="sr-only">
          Title
        </label>
        {/* A textarea so a long title wraps instead of scrolling out of sight; it stays one line of text. */}
        <textarea
          id="wd-title"
          value={title}
          onChange={(e) => changeTitle(e.target.value.replace(/\s*\n\s*/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          maxLength={TITLE_MAX}
          readOnly={!editable}
          rows={1}
          placeholder="Article title"
          className="w-full resize-none bg-transparent text-3xl font-extrabold leading-tight tracking-tight text-foreground [field-sizing:content] placeholder:text-muted-foreground/60 focus:outline-none sm:text-4xl"
        />
        <label htmlFor="wd-excerpt" className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Summary <span className="normal-case tracking-normal">(shown on the cards and in search, {excerpt.length}/{EXCERPT_MAX})</span>
        </label>
        <textarea
          id="wd-excerpt"
          value={excerpt}
          onChange={(e) => changeExcerpt(e.target.value)}
          maxLength={EXCERPT_MAX}
          readOnly={!editable}
          rows={2}
          placeholder="One or two sentences: what the reader will be able to do after reading."
          className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground [field-sizing:content] focus:border-accent focus:outline-none"
        />
        <div className="mt-6">
          <RichEditor draftId={id} initialValue={initial.body as PortableTextBlock[]} readOnly={!editable} onChange={changeBody} />
        </div>
        {editable && (
          <p className="mt-3 text-xs text-muted-foreground">
            Tip: you can paste from Google Docs or Word; headings, bold, links and lists come along.
          </p>
        )}
      </section>

      {tab === "preview" && (
        <section aria-label="Preview" className="mx-auto mt-6 max-w-4xl">
          <DraftPreview title={title} excerpt={excerpt} body={toBody(body)} authorName={authorName} />
        </section>
      )}
    </div>
  );
}
