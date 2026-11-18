"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PortableTextBlock } from "@portabletext/react";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import { deleteDraftAction, saveDraftAction, submitDraftAction } from "@/app/dashboard/write/actions";
import { markdownToBlocks, wordCount } from "@/lib/writer/markdown";
import { STATUS_LABEL, type DraftStatusName } from "@/lib/writer/status";
import { CODE_BLOCK, DEMO_BLOCK, insertBlock, link, prefixLines, wrap, type Edit } from "./toolbar";

type Props = {
  id: string;
  initial: { title: string; excerpt: string; markdown: string };
  status: DraftStatusName;
  reviewNote: string | null;
  authorName: string;
};

type SaveState = { kind: "saved"; at: Date } | { kind: "dirty" } | { kind: "saving" } | { kind: "error"; message: string };

const AUTOSAVE_MS = 1200;
const TITLE_MAX = 120;
const EXCERPT_MAX = 300;

/** One toolbar button; the label doubles as the accessible name. */
function Tool({ label, onClick, children, disabled }: { label: string; onClick: () => void; children: React.ReactNode; disabled: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/**
 * The Writer desk editor: Markdown on the left, the real article renderer on
 * the right (tabs on a phone). Saves on its own; an author can send the draft
 * for review, never publish it.
 */
export default function WriterEditor({ id, initial, status, reviewNote, authorName }: Props) {
  const router = useRouter();
  const editable = status === "WRITING" || status === "CHANGES_REQUESTED";
  const [title, setTitle] = useState(initial.title);
  const [excerpt, setExcerpt] = useState(initial.excerpt);
  const [markdown, setMarkdown] = useState(initial.markdown);
  const [save, setSave] = useState<SaveState>({ kind: "saved", at: new Date() });
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  // Counts edits, so a save that finishes after newer typing does not claim "Saved".
  const version = useRef(0);

  const blocks = useMemo(() => markdownToBlocks(markdown), [markdown]);
  const words = useMemo(() => wordCount(markdown), [markdown]);

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
  const changeMarkdown = changed(setMarkdown);

  // Autosave: a short pause after the last keystroke saves title, summary and text together.
  const dirty = save.kind === "dirty";
  useEffect(() => {
    if (!editable || !dirty) return;
    const timer = setTimeout(async () => {
      const savedVersion = version.current;
      setSave({ kind: "saving" });
      const result = await saveDraftAction(id, { title, excerpt, markdown });
      if (!result.ok) setSave({ kind: "error", message: result.error });
      else if (version.current === savedVersion) setSave({ kind: "saved", at: new Date() });
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [id, title, excerpt, markdown, editable, dirty]);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    const unsaved = save.kind === "dirty" || save.kind === "saving";
    if (!unsaved) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [save.kind]);

  function apply(edit: (text: string, start: number, end: number) => Edit) {
    const el = area.current;
    if (!el || !editable) return;
    const result = edit(markdown, el.selectionStart, el.selectionEnd);
    changeMarkdown(result.text);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(result.selStart, result.selEnd);
    });
  }

  async function send() {
    setSending(true);
    setSendError(null);
    const saved = await saveDraftAction(id, { title, excerpt, markdown });
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

      {/* Phone: one pane at a time */}
      <div role="tablist" aria-label="Editor view" className="mt-4 grid grid-cols-2 rounded-full border border-border p-1 lg:hidden">
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

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* Writing pane */}
        <section aria-label="Write" className={`${tab === "write" ? "" : "hidden"} min-w-0 lg:block`}>
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
            rows={2}
            placeholder="Article title"
            className="w-full resize-none bg-transparent text-2xl font-extrabold leading-tight tracking-tight text-foreground [field-sizing:content] placeholder:text-muted-foreground/60 focus:outline-none sm:text-3xl"
          />
          <label htmlFor="wd-excerpt" className="mt-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Summary <span className="normal-case tracking-normal">(shown on the cards and in search, {excerpt.length}/{EXCERPT_MAX})</span>
          </label>
          <textarea
            id="wd-excerpt"
            value={excerpt}
            onChange={(e) => changeExcerpt(e.target.value)}
            maxLength={EXCERPT_MAX}
            readOnly={!editable}
            rows={3}
            placeholder="One or two sentences: what the reader will be able to do after reading."
            className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground [field-sizing:content] focus:border-accent focus:outline-none"
          />

          <div className="mt-4 rounded-2xl border border-border bg-surface">
            <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 border-b border-border p-1.5">
              <Tool label="Heading" disabled={!editable} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "## "))}>H2</Tool>
              <Tool label="Subheading" disabled={!editable} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "### "))}>H3</Tool>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <Tool label="Bold" disabled={!editable} onClick={() => apply((t, s, e) => wrap(t, s, e, "**", "**", "bold text"))}>B</Tool>
              <Tool label="Italic" disabled={!editable} onClick={() => apply((t, s, e) => wrap(t, s, e, "*", "*", "italic text"))}>
                <em>I</em>
              </Tool>
              <Tool label="Inline code" disabled={!editable} onClick={() => apply((t, s, e) => wrap(t, s, e, "`", "`", "code"))}>
                <span className="font-mono">{"<>"}</span>
              </Tool>
              <Tool label="Link" disabled={!editable} onClick={() => apply(link)}>Link</Tool>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <Tool label="Bullet list" disabled={!editable} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "- "))}>• List</Tool>
              <Tool label="Numbered list" disabled={!editable} onClick={() => apply((t, s, e) => prefixLines(t, s, e, (i) => `${i + 1}. `))}>1. List</Tool>
              <Tool label="Tip box" disabled={!editable} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "> [!TIP] "))}>Tip</Tool>
              <Tool label="Warning box" disabled={!editable} onClick={() => apply((t, s, e) => prefixLines(t, s, e, "> [!WARNING] "))}>Warning</Tool>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
              <Tool label="Code block" disabled={!editable} onClick={() => apply((t, s, e) => insertBlock(t, s, e, CODE_BLOCK, 14))}>Code</Tool>
              <Tool label="Live demo" disabled={!editable} onClick={() => apply((t, s, e) => insertBlock(t, s, e, DEMO_BLOCK, 15))}>Demo</Tool>
              <Tool label="Divider" disabled={!editable} onClick={() => apply((t, s, e) => insertBlock(t, s, e, "---", 3))}>―</Tool>
            </div>
            <label htmlFor="wd-body" className="sr-only">
              Article text, in Markdown
            </label>
            <textarea
              id="wd-body"
              ref={area}
              value={markdown}
              onChange={(e) => changeMarkdown(e.target.value)}
              readOnly={!editable}
              spellCheck
              placeholder={"Start with the problem the reader has.\n\n## A heading\n\nA paragraph with **bold**, `code` and a [link](https://developer.mozilla.org)."}
              className="block min-h-[65dvh] w-full resize-y rounded-b-2xl bg-transparent p-4 font-mono text-[15px] leading-7 text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          <details className="mt-3 text-sm text-muted">
            <summary className="cursor-pointer font-semibold text-foreground">Formatting help</summary>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              <li>## Heading · ### Subheading</li>
              <li>**bold** · *italic* · `code` · [text](https://…)</li>
              <li>- bullet · 1. numbered · &gt; quote</li>
              <li>&gt; [!TIP] … · &gt; [!WARNING] … · &gt; [!INFO] …</li>
              <li>```js file.js … ``` code block · ```demo … ``` live demo · --- divider</li>
            </ul>
          </details>
        </section>

        {/* Preview pane: the article page's own renderer */}
        <section aria-label="Preview" className={`${tab === "preview" ? "" : "hidden"} min-w-0 lg:block`}>
          <div className="rounded-2xl border border-border bg-background p-5 sm:p-8 lg:sticky lg:top-32 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">Preview · as it will look</p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">{title || "Article title"}</h1>
            {excerpt && <p className="mt-3 text-lg leading-relaxed text-muted">{excerpt}</p>}
            <p className="mt-3 text-sm text-muted-foreground">By {authorName}</p>
            <div className="prose-editorial mt-8">
              {blocks.length > 0 ? (
                <PortableTextRenderer content={blocks as unknown as PortableTextBlock[]} />
              ) : (
                <p className="text-muted">The preview appears here as you write.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
