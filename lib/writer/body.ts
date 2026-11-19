/**
 * The article body of a Writer desk draft: Portable Text, the same format
 * Sanity stores, limited to the parts of the site's `blockContent` schema an
 * author may use. Everything an author sends passes `sanitizeBody` on the
 * server: unknown types, marks and fields never reach the database, and links
 * can only point to http(s), mailto or the site itself.
 */

export const STYLES = ["normal", "h2", "h3", "h4", "blockquote"] as const;
export const DECORATORS = ["strong", "em", "underline", "code", "strike-through"] as const;
export const LISTS = ["bullet", "number"] as const;
export const CODE_LANGUAGES = [
  "javascript",
  "typescript",
  "jsx",
  "tsx",
  "html",
  "css",
  "json",
  "bash",
  "python",
  "sql",
  "yaml",
  "markdown",
  "go",
  "rust",
  "java",
  "csharp",
  "php",
  "ruby",
] as const;
export const CALLOUT_TYPES = ["tip", "info", "warning", "error"] as const;
export const DIVIDER_STYLES = ["plain", "decorative", "dotted"] as const;
export const DEMO_HEIGHT = { min: 120, max: 900, initial: 320 } as const;
export const IMAGE_SIZES = ["small", "medium", "full"] as const;
export const IMAGE_ALIGNMENTS = ["left", "center", "right"] as const;
export const ALT_LIMITS = { min: 3, max: 125 } as const;
/** A Sanity image asset id: image-<sha1>-<width>x<height>-<format>. Only raster formats; never SVG. */
export const IMAGE_REF = /^image-[a-f0-9]{40}-\d{1,5}x\d{1,5}-(png|jpg|webp|gif)$/;

export const BODY_LIMITS = { blocks: 2000, text: 20_000, code: 50_000, bytes: 600_000, maxLevel: 3 } as const;

export type Span = { _type: "span"; _key: string; text: string; marks: string[] };
export type LinkDef = { _type: "link"; _key: string; href: string; blank: boolean };
export type TextBlock = {
  _type: "block";
  _key: string;
  style: (typeof STYLES)[number];
  listItem?: (typeof LISTS)[number];
  level?: number;
  markDefs: LinkDef[];
  children: Span[];
};
export type CodeBlock = { _type: "code"; _key: string; language: (typeof CODE_LANGUAGES)[number]; code: string; filename?: string };
export type CalloutBlock = { _type: "callout"; _key: string; type: (typeof CALLOUT_TYPES)[number]; text: string };
export type DemoBlock = { _type: "livePreview"; _key: string; title?: string; html?: string; css?: string; js?: string; height: number };
export type DividerBlock = { _type: "divider"; _key: string; style: (typeof DIVIDER_STYLES)[number] };
export type ImageBlock = {
  _type: "image";
  _key: string;
  asset: { _type: "reference"; _ref: string };
  alt?: string;
  caption?: string;
  size: (typeof IMAGE_SIZES)[number];
  alignment: (typeof IMAGE_ALIGNMENTS)[number];
};
export type BodyBlock = TextBlock | CodeBlock | CalloutBlock | DemoBlock | DividerBlock | ImageBlock;

type Result = { ok: true; value: BodyBlock[] } | { ok: false; error: string };

const KEY = /^[A-Za-z0-9_-]{1,64}$/;

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}

function text(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max) return null;
  return value;
}

/** A link target an author may use: the web, email, or a page or anchor on this site. */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href.length > 2048) return null;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:" ? href : null;
  } catch {
    // Not a parseable absolute URL and not a site path: not a link we accept.
    return null;
  }
}

function textBlock(b: Record<string, unknown>): TextBlock | string {
  const markDefs: LinkDef[] = [];
  for (const raw of Array.isArray(b.markDefs) ? b.markDefs : []) {
    const d = raw as Record<string, unknown>;
    if (d?._type !== "link" || typeof d._key !== "string" || !KEY.test(d._key)) continue;
    const href = safeHref(d.href);
    if (!href) return "A link points somewhere that is not a web or email address.";
    markDefs.push({ _type: "link", _key: d._key, href, blank: !href.startsWith("/") && !href.startsWith("#") });
  }
  const linkKeys = new Set(markDefs.map((d) => d._key));
  const children: Span[] = [];
  for (const raw of Array.isArray(b.children) ? b.children : []) {
    const s = raw as Record<string, unknown>;
    if (s?._type !== "span" || typeof s._key !== "string" || !KEY.test(s._key)) return "A piece of text could not be read.";
    const t = text(s.text, BODY_LIMITS.text);
    if (t === null) return "One paragraph is too long; split it into smaller ones.";
    const marks = (Array.isArray(s.marks) ? s.marks : []).filter(
      (m): m is string => typeof m === "string" && ((DECORATORS as readonly string[]).includes(m) || linkKeys.has(m)),
    );
    children.push({ _type: "span", _key: s._key, text: t, marks });
  }
  if (children.length === 0) children.push({ _type: "span", _key: `${b._key as string}s`, text: "", marks: [] });
  const usedLinks = new Set(children.flatMap((c) => c.marks));
  const block: TextBlock = {
    _type: "block",
    _key: b._key as string,
    style: oneOf(STYLES, b.style, "normal"),
    markDefs: markDefs.filter((d) => usedLinks.has(d._key)),
    children,
  };
  if ((LISTS as readonly string[]).includes(b.listItem as string)) {
    block.listItem = b.listItem as TextBlock["listItem"];
    const level = typeof b.level === "number" && Number.isInteger(b.level) ? b.level : 1;
    block.level = Math.min(Math.max(level, 1), BODY_LIMITS.maxLevel);
  }
  return block;
}

function objectBlock(b: Record<string, unknown>): BodyBlock | string {
  const _key = b._key as string;
  switch (b._type) {
    case "code": {
      const code = text(b.code, BODY_LIMITS.code);
      const filename = text(b.filename, 200);
      if (code === null) return "A code block is too long.";
      if (filename === null) return "A code block's file name is too long.";
      return { _type: "code", _key, language: oneOf(CODE_LANGUAGES, b.language, "javascript"), code, ...(filename.trim() ? { filename: filename.trim() } : {}) };
    }
    case "callout": {
      const t = text(b.text, 2000);
      if (t === null) return "A highlighted box is too long; keep it to a few sentences.";
      return { _type: "callout", _key, type: oneOf(CALLOUT_TYPES, b.type, "tip"), text: t };
    }
    case "livePreview": {
      const fields = { title: text(b.title, 200), html: text(b.html, BODY_LIMITS.code), css: text(b.css, BODY_LIMITS.code), js: text(b.js, BODY_LIMITS.code) };
      if (Object.values(fields).some((v) => v === null)) return "A live demo is too long.";
      const raw = typeof b.height === "number" && Number.isFinite(b.height) ? Math.round(b.height) : DEMO_HEIGHT.initial;
      const demo: DemoBlock = { _type: "livePreview", _key, height: Math.min(Math.max(raw, DEMO_HEIGHT.min), DEMO_HEIGHT.max) };
      for (const [k, v] of Object.entries(fields)) if (v) demo[k as "title" | "html" | "css" | "js"] = v;
      return demo;
    }
    case "divider":
      return { _type: "divider", _key, style: oneOf(DIVIDER_STYLES, b.style, "plain") };
    case "image": {
      const ref = (b.asset as { _ref?: unknown } | undefined)?._ref;
      if (typeof ref !== "string" || !IMAGE_REF.test(ref)) return "An image could not be read; upload it again.";
      const alt = text(b.alt, ALT_LIMITS.max);
      const caption = text(b.caption, 300);
      if (alt === null) return `An image description can be at most ${ALT_LIMITS.max} characters.`;
      if (caption === null) return "An image caption is too long.";
      const image: ImageBlock = {
        _type: "image",
        _key,
        asset: { _type: "reference", _ref: ref },
        size: oneOf(IMAGE_SIZES, b.size, "full"),
        alignment: oneOf(IMAGE_ALIGNMENTS, b.alignment, "center"),
      };
      if (alt.trim()) image.alt = alt.trim();
      if (caption.trim()) image.caption = caption.trim();
      return image;
    }
    default:
      return "The article contains a part this editor does not support.";
  }
}

/** Rebuilds the body from known parts only; anything else is refused with a message for the author. */
export function sanitizeBody(raw: unknown): Result {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "The article text could not be read." };
  if (raw.length > BODY_LIMITS.blocks || JSON.stringify(raw).length > BODY_LIMITS.bytes) {
    return { ok: false, error: "The article is too long to save in one draft." };
  }
  const value: BodyBlock[] = [];
  const keys = new Set<string>();
  for (const item of raw) {
    const b = item as Record<string, unknown>;
    if (!b || typeof b !== "object" || typeof b._key !== "string" || !KEY.test(b._key) || keys.has(b._key)) {
      return { ok: false, error: "The article text could not be read." };
    }
    keys.add(b._key);
    const block = b._type === "block" ? textBlock(b) : objectBlock(b);
    if (typeof block === "string") return { ok: false, error: block };
    value.push(block);
  }
  return { ok: true, value };
}

/** A stored body, or an empty one when it cannot be read (never trusted as-is). */
export function toBody(stored: unknown): BodyBlock[] {
  const result = sanitizeBody(stored);
  return result.ok ? result.value : [];
}

/** Images an author has not described yet; readers on screen readers would get nothing. */
export function imagesWithoutAlt(body: BodyBlock[]): number {
  return body.filter((b) => b._type === "image" && (b.alt ?? "").length < ALT_LIMITS.min).length;
}

/** The words a reader reads: paragraphs, headings, lists and highlighted boxes, not code. */
export function wordCount(body: BodyBlock[]): number {
  let n = 0;
  for (const b of body) {
    const t = b._type === "block" ? b.children.map((c) => c.text).join("") : b._type === "callout" ? b.text : "";
    n += t.split(/\s+/).filter(Boolean).length;
  }
  return n;
}
