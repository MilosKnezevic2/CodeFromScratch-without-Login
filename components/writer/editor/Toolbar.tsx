"use client";

import { useEditor, useEditorSelector, type EditorSelection } from "@portabletext/editor";
import { getActiveAnnotations, getActiveStyle, isActiveDecorator, isActiveListItem, isSelectionExpanded } from "@portabletext/editor/selectors";
import { useRef, useState, type ReactNode } from "react";
import { safeHref, STYLES } from "@/lib/writer/body";
import { STYLE_LABEL } from "./schema";

const btn =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold text-muted transition hover:bg-surface-2 hover:text-foreground aria-pressed:bg-accent/15 aria-pressed:text-accent disabled:opacity-40";

function Tool({ label, pressed, onClick, disabled, children }: { label: string; pressed?: boolean; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      // Keeps the text selection in the editor while the button is clicked.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={btn}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;
}

function Decorator({ name, label, children }: { name: string; label: string; children: ReactNode }) {
  const editor = useEditor();
  const active = useEditorSelector(editor, isActiveDecorator(name));
  return (
    <Tool
      label={label}
      pressed={active}
      onClick={() => {
        editor.send({ type: "decorator.toggle", decorator: name });
        editor.send({ type: "focus" });
      }}
    >
      {children}
    </Tool>
  );
}

function List({ name, label, children }: { name: string; label: string; children: ReactNode }) {
  const editor = useEditor();
  const active = useEditorSelector(editor, isActiveListItem(name));
  return (
    <Tool
      label={label}
      pressed={active}
      onClick={() => {
        editor.send({ type: "list item.toggle", listItem: name });
        editor.send({ type: "focus" });
      }}
    >
      {children}
    </Tool>
  );
}

function StyleSelect() {
  const editor = useEditor();
  const active = useEditorSelector(editor, getActiveStyle) ?? "normal";
  return (
    <>
      <label htmlFor="pte-style" className="sr-only">
        Text style
      </label>
      <select
        id="pte-style"
        value={(STYLES as readonly string[]).includes(active) ? active : "normal"}
        onChange={(e) => {
          editor.send({ type: "style.toggle", style: e.target.value });
          editor.send({ type: "focus" });
        }}
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm font-semibold text-foreground focus:border-accent focus:outline-none"
      >
        {STYLES.map((s) => (
          <option key={s} value={s}>
            {STYLE_LABEL[s]}
          </option>
        ))}
      </select>
    </>
  );
}

/** Adds a link to the selected text, or removes the one the cursor is in. */
function LinkTool() {
  const editor = useEditor();
  const expanded = useEditorSelector(editor, isSelectionExpanded);
  const activeLink = useEditorSelector(editor, (s) => getActiveAnnotations(s).find((a) => a._type === "link"));
  const [open, setOpen] = useState<{ at: NonNullable<EditorSelection> } | null>(null);
  const [href, setHref] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (activeLink) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 text-xs">
        <span className="max-w-40 truncate font-mono text-accent" title={String(activeLink.href ?? "")}>
          {String(activeLink.href ?? "")}
        </span>
        <Tool
          label="Remove link"
          onClick={() => {
            editor.send({ type: "annotation.remove", annotation: { name: "link" } });
            editor.send({ type: "focus" });
          }}
        >
          ✕
        </Tool>
      </span>
    );
  }

  return (
    <span className="relative">
      <Tool
        label={expanded ? "Link" : "Link: select some text first"}
        disabled={!expanded}
        onClick={() => {
          const at = editor.getSnapshot().context.selection;
          if (!at) return;
          setHref("");
          setError(null);
          setOpen({ at });
        }}
      >
        Link
      </Tool>
      {open && (
        <form
          className="absolute left-0 top-11 z-30 flex w-[min(22rem,80vw)] flex-col gap-2 rounded-xl border border-border bg-surface p-3 shadow-lg"
          onSubmit={(e) => {
            e.preventDefault();
            const safe = safeHref(href);
            if (!safe) {
              setError("Use a full address (https://…), an email (mailto:…) or a page on this site (/blog/…).");
              return;
            }
            editor.send({ type: "annotation.add", annotation: { name: "link", value: { href: safe, blank: !safe.startsWith("/") && !safe.startsWith("#") } }, at: open.at });
            setOpen(null);
            editor.send({ type: "focus" });
          }}
        >
          <label htmlFor="pte-href" className="text-xs font-semibold text-foreground">
            Link address
          </label>
          <input
            id="pte-href"
            autoFocus
            type="url"
            inputMode="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(null);
            }}
            placeholder="https://developer.mozilla.org/…"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "pte-href-error" : undefined}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground focus:border-accent focus:outline-none"
          />
          {error && (
            <p id="pte-href-error" role="alert" className="text-xs font-semibold text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" className="min-h-9 rounded-full bg-accent px-4 text-xs font-bold text-accent-foreground">
              Add link
            </button>
            <button type="button" onClick={() => setOpen(null)} className="min-h-9 rounded-full px-3 text-xs font-semibold text-muted hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      )}
    </span>
  );
}

const INSERTS = [
  { label: "Code block", block: { _type: "code", language: "javascript", code: "" } },
  { label: "Tip box", block: { _type: "callout", type: "tip", text: "" } },
  { label: "Warning box", block: { _type: "callout", type: "warning", text: "" } },
  { label: "Live demo", block: { _type: "livePreview", html: "", css: "", js: "", height: 320 } },
  { label: "Divider", block: { _type: "divider", style: "plain" } },
] as const;

function Insert() {
  const editor = useEditor();
  return (
    <>
      {INSERTS.map((item) => (
        <Tool
          key={item.label}
          label={`Insert ${item.label.toLowerCase()}`}
          onClick={() => {
            editor.send({ type: "insert.block", block: { ...item.block }, placement: "after", select: "none" });
          }}
        >
          + {item.label.replace(" block", "").replace(" box", "")}
        </Tool>
      ))}
    </>
  );
}

/** Uploads a picture through the server and places it after the cursor. */
function ImageTool({ draftId }: { draftId: string }) {
  const editor = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set("draftId", draftId);
    form.set("file", file);
    try {
      const res = await fetch("/api/writer/images", { method: "POST", body: form });
      const data: { ref?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok || !data.ref) {
        setError(data.error ?? "The image could not be uploaded.");
        return;
      }
      editor.send({
        type: "insert.block",
        block: { _type: "image", asset: { _type: "reference", _ref: data.ref }, alt: "", size: "full", alignment: "center" },
        placement: "after",
        select: "none",
      });
    } catch {
      // fetch throws only when the request never completed.
      setError("No connection. Check your internet and try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <span className="inline-flex items-center">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Tool label="Insert image" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? "Uploading…" : "+ Image"}
      </Tool>
      {error && (
        <span role="alert" className="ml-1 text-xs font-semibold text-red-600 dark:text-red-300">
          {error}
        </span>
      )}
    </span>
  );
}

/** The formatting bar above the text, the same set of tools as the Studio's article field. */
export default function Toolbar({ draftId }: { draftId: string }) {
  const editor = useEditor();
  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
      <StyleSelect />
      <Divider />
      <Decorator name="strong" label="Bold (Ctrl+B)">
        <strong>B</strong>
      </Decorator>
      <Decorator name="em" label="Italic (Ctrl+I)">
        <em className="font-serif">I</em>
      </Decorator>
      <Decorator name="underline" label="Underline (Ctrl+U)">
        <span className="underline">U</span>
      </Decorator>
      <Decorator name="strike-through" label="Strikethrough">
        <span className="line-through">S</span>
      </Decorator>
      <Decorator name="code" label="Inline code (Ctrl+')">
        <span className="font-mono text-xs">{"</>"}</span>
      </Decorator>
      <LinkTool />
      <Divider />
      <List name="bullet" label="Bullet list">
        • List
      </List>
      <List name="number" label="Numbered list">
        1. List
      </List>
      <Divider />
      <ImageTool draftId={draftId} />
      <Insert />
      <Divider />
      <Tool label="Undo (Ctrl+Z)" onClick={() => editor.send({ type: "history.undo" })}>
        ↶
      </Tool>
      <Tool label="Redo (Ctrl+Shift+Z)" onClick={() => editor.send({ type: "history.redo" })}>
        ↷
      </Tool>
    </div>
  );
}
