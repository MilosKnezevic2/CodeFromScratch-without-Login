"use client";

import { useEditor, type BlockPath } from "@portabletext/editor";
import { useState, type ReactNode, type SyntheticEvent } from "react";
import LivePreview from "@/components/blog/LivePreview";
import { urlFor } from "@/lib/sanity/image";
import { ALT_LIMITS, CALLOUT_TYPES, CODE_LANGUAGES, DEMO_HEIGHT, DIVIDER_STYLES, IMAGE_ALIGNMENTS, IMAGE_REF, IMAGE_SIZES } from "@/lib/writer/body";

/** A block object as the editor holds it: its key plus the fields from the schema. */
export type ObjectValue = { _key: string; [field: string]: unknown };
type CardProps = { value: ObjectValue; path: BlockPath; selected: boolean; readOnly: boolean };

const field = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none";
const code = `${field} font-mono text-[13px] leading-6 [field-sizing:content] min-h-24 resize-y`;

/** Keeps an input's own text while the author types, and follows the block when it changes from outside (undo). */
function useFieldText(value: unknown) {
  const text = typeof value === "string" ? value : "";
  const [local, setLocal] = useState(text);
  const [seen, setSeen] = useState(text);
  if (text !== seen) {
    setSeen(text);
    setLocal(text);
  }
  return [local, setLocal] as const;
}

// The editor listens for keys, paste and typing; inside a card those belong to the card's own fields.
const own = (e: SyntheticEvent) => e.stopPropagation();

/** The frame every non-text block shares: a label, its fields, and move/remove controls (like Sanity's block cards). */
function Card({ label, path, selected, readOnly, children }: { label: string; path: BlockPath; selected: boolean; readOnly: boolean; children: ReactNode }) {
  const editor = useEditor();
  const control = "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-foreground";
  return (
    <div
      contentEditable={false}
      onKeyDown={own}
      onPaste={own}
      onCopy={own}
      onCut={own}
      onBeforeInput={own}
      className={`my-6 rounded-xl border bg-surface p-3 sm:p-4 ${selected ? "border-accent ring-2 ring-accent/30" : "border-border"}`}
    >
      <div className="mb-3 flex items-center gap-1">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-accent">{label}</span>
        {!readOnly && (
          <span className="ml-auto flex items-center gap-0.5">
            <button type="button" className={control} aria-label={`Move ${label} up`} title="Move up" onClick={() => editor.send({ type: "move.block up", at: path })}>
              ↑
            </button>
            <button type="button" className={control} aria-label={`Move ${label} down`} title="Move down" onClick={() => editor.send({ type: "move.block down", at: path })}>
              ↓
            </button>
            <button
              type="button"
              className={`${control} hover:text-red-600 dark:hover:text-red-300`}
              aria-label={`Remove ${label}`}
              title="Remove"
              onClick={() => editor.send({ type: "delete.block", at: path })}
            >
              Remove
            </button>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function useSetField(path: BlockPath) {
  const editor = useEditor();
  return (props: Record<string, unknown>) => editor.send({ type: "block.set", at: path, props });
}

/** Tab in a code field indents instead of leaving the field. */
function indentOnTab(e: React.KeyboardEvent<HTMLTextAreaElement>, set: (v: string) => void) {
  e.stopPropagation();
  if (e.key !== "Tab" || e.shiftKey) return;
  e.preventDefault();
  const el = e.currentTarget;
  const { selectionStart: s, selectionEnd: end, value } = el;
  const next = `${value.slice(0, s)}  ${value.slice(end)}`;
  set(next);
  requestAnimationFrame(() => el.setSelectionRange(s + 2, s + 2));
}

export function CodeCard({ value, path, selected, readOnly }: CardProps) {
  const set = useSetField(path);
  const [text, setText] = useFieldText(value.code);
  const [filename, setFilename] = useFieldText(value.filename);
  const id = `code-${value._key}`;
  const change = (v: string) => {
    setText(v);
    set({ code: v });
  };
  return (
    <Card label="Code" path={path} selected={selected} readOnly={readOnly}>
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <label className="sr-only" htmlFor={`${id}-lang`}>
          Language
        </label>
        <select
          id={`${id}-lang`}
          value={typeof value.language === "string" ? value.language : "javascript"}
          disabled={readOnly}
          onChange={(e) => set({ language: e.target.value })}
          className={field}
        >
          {CODE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`${id}-file`}>
          File name (optional)
        </label>
        <input
          id={`${id}-file`}
          value={filename}
          readOnly={readOnly}
          maxLength={200}
          placeholder="File name, optional (components/Button.tsx)"
          onChange={(e) => {
            setFilename(e.target.value);
            set({ filename: e.target.value });
          }}
          className={`${field} font-mono`}
        />
      </div>
      <label className="sr-only" htmlFor={id}>
        Code
      </label>
      <textarea
        id={id}
        value={text}
        readOnly={readOnly}
        spellCheck={false}
        placeholder="Paste or type the code"
        onKeyDown={(e) => indentOnTab(e, change)}
        onChange={(e) => change(e.target.value)}
        className={`${code} mt-2`}
      />
    </Card>
  );
}

const CALLOUT_TONE: Record<(typeof CALLOUT_TYPES)[number], string> = {
  tip: "border-accent bg-accent/10",
  info: "border-cyan-500 bg-cyan-500/10",
  warning: "border-yellow-500 bg-yellow-500/10",
  error: "border-red-500 bg-red-500/10",
};

export function CalloutCard({ value, path, selected, readOnly }: CardProps) {
  const set = useSetField(path);
  const [text, setText] = useFieldText(value.text);
  const type = (CALLOUT_TYPES as readonly string[]).includes(value.type as string) ? (value.type as (typeof CALLOUT_TYPES)[number]) : "tip";
  const id = `callout-${value._key}`;
  return (
    <Card label="Highlighted box" path={path} selected={selected} readOnly={readOnly}>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">Kind of box</legend>
        {CALLOUT_TYPES.map((t) => (
          <label
            key={t}
            className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-bold capitalize transition has-[:checked]:border-accent has-[:checked]:bg-accent has-[:checked]:text-accent-foreground has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${readOnly ? "pointer-events-none opacity-70" : ""} border-border text-muted`}
          >
            <input type="radio" name={id} value={t} checked={type === t} disabled={readOnly} onChange={() => set({ type: t })} className="sr-only" />
            {t}
          </label>
        ))}
      </fieldset>
      <label className="sr-only" htmlFor={id}>
        Box text
      </label>
      <textarea
        id={id}
        value={text}
        readOnly={readOnly}
        maxLength={2000}
        placeholder="One or two sentences the reader should not miss."
        onChange={(e) => {
          setText(e.target.value);
          set({ text: e.target.value });
        }}
        className={`mt-2 w-full resize-y rounded-r-lg border-0 border-l-4 px-3 py-2 text-sm text-foreground [field-sizing:content] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${CALLOUT_TONE[type]}`}
      />
    </Card>
  );
}

export function DemoCard({ value, path, selected, readOnly }: CardProps) {
  const set = useSetField(path);
  const [title, setTitle] = useFieldText(value.title);
  const [html, setHtml] = useFieldText(value.html);
  const [css, setCss] = useFieldText(value.css);
  const [js, setJs] = useFieldText(value.js);
  const [running, setRunning] = useState(false);
  const height = typeof value.height === "number" ? value.height : DEMO_HEIGHT.initial;
  const id = `demo-${value._key}`;
  const parts = [
    ["html", "HTML", html, setHtml],
    ["css", "CSS", css, setCss],
    ["js", "JavaScript", js, setJs],
  ] as const;
  return (
    <Card label="Live demo" path={path} selected={selected} readOnly={readOnly}>
      <label className="sr-only" htmlFor={`${id}-title`}>
        Demo title
      </label>
      <input
        id={`${id}-title`}
        value={title}
        readOnly={readOnly}
        maxLength={200}
        placeholder="Title shown above the demo (Login form with validation)"
        onChange={(e) => {
          setTitle(e.target.value);
          set({ title: e.target.value });
        }}
        className={field}
      />
      <div className="mt-2 grid gap-2 lg:grid-cols-3">
        {parts.map(([key, label, v, setV]) => (
          <div key={key} className="min-w-0">
            <label htmlFor={`${id}-${key}`} className="mb-1 block text-xs font-semibold text-muted">
              {label}
            </label>
            <textarea
              id={`${id}-${key}`}
              value={v}
              readOnly={readOnly}
              spellCheck={false}
              onKeyDown={(e) =>
                indentOnTab(e, (next) => {
                  setV(next);
                  set({ [key]: next });
                })
              }
              onChange={(e) => {
                setV(e.target.value);
                set({ [key]: e.target.value });
              }}
              className={code}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-height`} className="text-xs font-semibold text-muted">
          Height (px)
        </label>
        <input
          id={`${id}-height`}
          type="number"
          inputMode="numeric"
          min={DEMO_HEIGHT.min}
          max={DEMO_HEIGHT.max}
          step={20}
          value={height}
          readOnly={readOnly}
          onChange={(e) => set({ height: Number(e.target.value) || DEMO_HEIGHT.initial })}
          className={`${field} w-24`}
        />
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          aria-expanded={running}
          className="ml-auto min-h-9 rounded-full border border-border px-4 text-xs font-bold text-foreground transition hover:border-accent/50"
        >
          {running ? "Hide result" : "Run it"}
        </button>
      </div>
      {running && (
        <div className="mt-3">
          <LivePreview title={title || undefined} html={html} css={css} js={js} height={height} />
        </div>
      )}
    </Card>
  );
}

export function DividerCard({ value, path, selected, readOnly }: CardProps) {
  const set = useSetField(path);
  const style = (DIVIDER_STYLES as readonly string[]).includes(value.style as string) ? (value.style as string) : "plain";
  return (
    <Card label="Divider" path={path} selected={selected} readOnly={readOnly}>
      <div className="flex flex-wrap items-center gap-3">
        <hr className={`min-w-24 flex-1 border-0 border-t ${style === "dotted" ? "border-dashed border-muted-foreground/40" : "border-border"}`} />
        <label htmlFor={`divider-${value._key}`} className="sr-only">
          Divider style
        </label>
        <select id={`divider-${value._key}`} value={style} disabled={readOnly} onChange={(e) => set({ style: e.target.value })} className={`${field} w-auto`}>
          {DIVIDER_STYLES.map((s) => (
            <option key={s} value={s}>
              {s === "plain" ? "Plain line" : s === "decorative" ? "Decorative" : "Dotted"}
            </option>
          ))}
        </select>
      </div>
    </Card>
  );
}

const SIZE_LABEL: Record<(typeof IMAGE_SIZES)[number], string> = { small: "Small", medium: "Medium", full: "Full width" };

export function ImageCard({ value, path, selected, readOnly }: CardProps) {
  const set = useSetField(path);
  const [alt, setAlt] = useFieldText(value.alt);
  const [caption, setCaption] = useFieldText(value.caption);
  const ref = (value.asset as { _ref?: unknown } | undefined)?._ref;
  const valid = typeof ref === "string" && IMAGE_REF.test(ref);
  const missingAlt = alt.trim().length < ALT_LIMITS.min;
  const id = `image-${value._key}`;
  const size = (IMAGE_SIZES as readonly string[]).includes(value.size as string) ? (value.size as string) : "full";
  const alignment = (IMAGE_ALIGNMENTS as readonly string[]).includes(value.alignment as string) ? (value.alignment as string) : "center";
  return (
    <Card label="Image" path={path} selected={selected} readOnly={readOnly}>
      {valid ? (
        // eslint-disable-next-line @next/next/no-img-element -- an editing preview of a just-uploaded asset; the article itself uses next/image
        <img src={urlFor({ asset: { _ref: ref } }).width(1200).url()} alt={alt} className="mx-auto max-h-[28rem] w-auto rounded-lg" />
      ) : (
        <p className="text-sm text-muted">This image could not be shown; remove it and upload it again.</p>
      )}
      <div className="mt-3 grid gap-2">
        <label htmlFor={`${id}-alt`} className="text-xs font-semibold text-foreground">
          Description for screen readers (alt text) <span className="text-red-600 dark:text-red-300">*</span>
        </label>
        <input
          id={`${id}-alt`}
          value={alt}
          readOnly={readOnly}
          maxLength={ALT_LIMITS.max}
          aria-required="true"
          aria-invalid={missingAlt ? true : undefined}
          aria-describedby={`${id}-alt-help`}
          placeholder="What the image shows, e.g. Network tab with two overlapping requests"
          onChange={(e) => {
            setAlt(e.target.value);
            set({ alt: e.target.value });
          }}
          className={field}
        />
        <p id={`${id}-alt-help`} className={`text-xs ${missingAlt ? "font-semibold text-yellow-700 dark:text-yellow-300" : "text-muted-foreground"}`}>
          {missingAlt ? "Needed before you can send the article." : `${alt.length}/${ALT_LIMITS.max}`}
        </p>
        <label htmlFor={`${id}-caption`} className="sr-only">
          Caption (optional)
        </label>
        <input
          id={`${id}-caption`}
          value={caption}
          readOnly={readOnly}
          maxLength={300}
          placeholder="Caption under the image (optional)"
          onChange={(e) => {
            setCaption(e.target.value);
            set({ caption: e.target.value });
          }}
          className={field}
        />
        <div className="flex flex-wrap gap-2">
          <label htmlFor={`${id}-size`} className="sr-only">
            Size
          </label>
          <select id={`${id}-size`} value={size} disabled={readOnly} onChange={(e) => set({ size: e.target.value })} className={`${field} w-auto`}>
            {IMAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {SIZE_LABEL[s]}
              </option>
            ))}
          </select>
          <label htmlFor={`${id}-align`} className="sr-only">
            Alignment
          </label>
          <select id={`${id}-align`} value={alignment} disabled={readOnly} onChange={(e) => set({ alignment: e.target.value })} className={`${field} w-auto capitalize`}>
            {IMAGE_ALIGNMENTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );
}
