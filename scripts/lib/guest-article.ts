/**
 * Turns a guest author's article (the Markdown template from
 * brand-brain/guest-authors/) into the Sanity post content, without changing
 * a word: only the form is translated, block by block. Anything the site
 * cannot show the same way is reported as an error, never guessed.
 *
 * Pure: no files, no network. scripts/import-guest-post.mts reads the folder,
 * uploads the images and writes to Sanity.
 */
import { randomUUID } from "node:crypto";
import MarkdownIt from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { parse as parseYaml } from "yaml";

export const LIMITS = {
  title: [10, 120],
  excerpt: [60, 280],
  lead: [20, 400],
  bio: [20, 400],
  alt: 125,
} as const;

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

const LANGUAGES = new Set([
  "javascript", "typescript", "python", "html", "css", "json", "bash", "jsx", "tsx",
  "sql", "go", "rust", "java", "csharp", "php", "ruby", "yaml", "markdown",
]);
const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript", mjs: "javascript", cjs: "javascript", ts: "typescript", mts: "typescript",
  py: "python", sh: "bash", shell: "bash", zsh: "bash", console: "bash", terminal: "bash",
  yml: "yaml", md: "markdown", cs: "csharp", "c#": "csharp", rb: "ruby", golang: "go", htm: "html",
};

const CALLOUTS: Record<string, string> = {
  TIP: "tip", NOTE: "info", INFO: "info", IMPORTANT: "info", WARNING: "warning", CAUTION: "error", DANGER: "error",
};

const EMBED_HOSTS: [RegExp, string][] = [
  [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
  [/(^|\.)vimeo\.com$/, "vimeo"],
  [/(^|\.)(twitter|x)\.com$/, "twitter"],
  [/(^|\.)codepen\.io$/, "codepen"],
  [/(^|\.)codesandbox\.io$/, "codesandbox"],
];

export type Span = { _type: "span"; _key: string; text: string; marks: string[] };
export type LinkDef = { _type: "link"; _key: string; href: string; blank: boolean };
export type TextBlock = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: LinkDef[];
  children: Span[];
  listItem?: "bullet" | "number";
  level?: number;
};
export type ImageBlock = {
  _type: "image";
  _key: string;
  alt: string;
  caption?: string;
  size: "full";
  alignment: "center";
  asset?: { _type: "reference"; _ref: string };
};
export type ContentBlock =
  | TextBlock
  | ImageBlock
  | { _type: "lead"; _key: string; text: string }
  | { _type: "code"; _key: string; language: string; code: string; filename?: string }
  | { _type: "callout"; _key: string; type: string; text: string }
  | { _type: "embed"; _key: string; url: string; provider: string; caption?: string }
  | { _type: "table"; _key: string; caption?: string; hasHeader: boolean; rows: { _key: string; cells: string[] }[] }
  | { _type: "divider"; _key: string; style: "plain" };

export type GuestAuthor = {
  name: string;
  bio?: string;
  photo?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  website?: string;
};

export type GuestMeta = {
  title: string;
  excerpt: string;
  lead?: string;
  difficulty?: (typeof DIFFICULTIES)[number];
  tags: string[];
  author: GuestAuthor;
};

export type Converted = {
  meta: GuestMeta | null;
  content: ContentBlock[];
  /** Image blocks still without an asset, with the file each one needs. */
  images: { key: string; src: string }[];
  errors: string[];
  warnings: string[];
};

const newKey = () => randomUUID().replace(/-/g, "").slice(0, 12);

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 96)
    .replace(/-$/, "");
}

/** http(s), mailto, a page on this site (/blog/...) or an anchor (#...). */
export function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^#[\w-]+$/.test(href)) return href;
  if (/^\/(?!\/)[^\s]*$/.test(href)) return href;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    // Not an absolute URL and none of the forms above.
    return null;
  }
}

/** Splits "---\n<yaml>\n---\n<body>". */
export function splitFrontMatter(source: string): { yaml: string; body: string } | null {
  const text = source.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/.exec(text);
  return m ? { yaml: m[1], body: m[2] } : null;
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim());

function handle(raw: string, host: RegExp, prefix = ""): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (!host.test(url.hostname.replace(/^www\./, ""))) return undefined;
    const path = url.pathname.replace(/^\/+|\/+$/g, "");
    return prefix ? path.replace(new RegExp(`^${prefix}/`), "") || undefined : path.split("/")[0] || undefined;
  } catch {
    // A bare username rather than a link.
    return value.replace(/^@/, "").replace(/[^\w.-]/g, "") || undefined;
  }
}

export function readMeta(yamlText: string, errors: string[], warnings: string[]): GuestMeta | null {
  let raw: unknown;
  try {
    raw = parseYaml(yamlText);
  } catch (e) {
    errors.push(`The fields at the top could not be read: ${(e as Error).message.split("\n")[0]}`);
    return null;
  }
  if (!raw || typeof raw !== "object") {
    errors.push("The fields at the top are empty.");
    return null;
  }
  const r = raw as Record<string, unknown>;
  const within = (field: "title" | "excerpt" | "lead" | "bio", value: string) => {
    const [min, max] = LIMITS[field];
    if (value.length < min || value.length > max) errors.push(`${field}: ${value.length} characters, needs ${min}-${max}.`);
  };
  const title = str(r.title);
  const excerpt = str(r.excerpt);
  within("title", title);
  within("excerpt", excerpt);
  const lead = str(r.lead);
  if (lead) within("lead", lead);
  else warnings.push("No lead: the article starts without the short summary box.");

  const difficulty = str(r.difficulty).toLowerCase();
  if (difficulty && !(DIFFICULTIES as readonly string[]).includes(difficulty)) {
    errors.push(`difficulty: "${difficulty}" is not one of ${DIFFICULTIES.join(", ")}.`);
  }

  const tags = Array.isArray(r.tags) ? r.tags.map(str).filter(Boolean) : [];

  const a = (r.author && typeof r.author === "object" ? r.author : {}) as Record<string, unknown>;
  const name = str(a.name);
  if (name.length < 2 || name.length > 80) errors.push("author.name is missing.");
  if (/^your name$/i.test(name)) errors.push('author.name is still "Your Name" from the template.');
  const bio = str(a.bio);
  if (bio) within("bio", bio);
  else warnings.push("author.bio is empty.");
  const website = str(a.website);
  const site = website ? safeHref(website) : null;
  const author: GuestAuthor = {
    name,
    ...(bio ? { bio } : {}),
    ...(str(a.photo) ? { photo: str(a.photo) } : {}),
    github: handle(str(a.github), /^github\.com$/),
    linkedin: handle(str(a.linkedin), /^linkedin\.com$/, "in"),
    twitter: handle(str(a.twitter), /^(twitter|x)\.com$/),
    website: site && /^https?:/.test(site) ? site : undefined,
  };
  if (website && !author.website) errors.push(`author.website "${website}" is not a full https:// address.`);
  for (const k of ["github", "linkedin", "twitter", "website"] as const) if (!author[k]) delete author[k];
  if (!author.github && !author.linkedin && !author.twitter && !author.website) warnings.push("The author gave no link.");

  return {
    title,
    excerpt,
    ...(lead ? { lead } : {}),
    ...(difficulty ? { difficulty: difficulty as GuestMeta["difficulty"] } : {}),
    tags,
    author,
  };
}

const md = new MarkdownIt("default", { html: false, linkify: false, typographer: false });

function plainText(children: Token[] | null): string {
  let out = "";
  for (const t of children ?? []) {
    if (t.type === "text" || t.type === "code_inline") out += t.content;
    else if (t.type === "softbreak") out += " ";
    else if (t.type === "hardbreak") out += "\n";
    else if (t.type === "image") out += plainText(t.children);
  }
  return out;
}

const MARK_OF: Record<string, string> = { strong_open: "strong", em_open: "em", s_open: "strike-through" };
const CLOSE_OF: Record<string, string> = { strong_close: "strong", em_close: "em", s_close: "strike-through" };

/** Inline Markdown to spans and link definitions. */
function spans(children: Token[], key: () => string, errors: string[], where: string) {
  const out: Span[] = [];
  const markDefs: LinkDef[] = [];
  const marks: string[] = [];
  const push = (text: string, extra: string[] = []) => {
    if (!text) return;
    const all = [...marks, ...extra];
    const last = out.at(-1);
    if (last && last.marks.length === all.length && last.marks.every((m, i) => m === all[i])) last.text += text;
    else out.push({ _type: "span", _key: key(), text, marks: all });
  };
  for (const t of children) {
    if (MARK_OF[t.type]) marks.push(MARK_OF[t.type]);
    else if (CLOSE_OF[t.type]) marks.splice(marks.lastIndexOf(CLOSE_OF[t.type]), 1);
    else if (t.type === "link_open") {
      const raw = t.attrGet("href") ?? "";
      const href = safeHref(raw);
      if (!href) errors.push(`${where}: the link "${raw}" is not a full address (https://...), mailto: or a /page on this site.`);
      const def: LinkDef = { _type: "link", _key: key(), href: href ?? "", blank: !!href && /^https?:/.test(href) };
      markDefs.push(def);
      marks.push(def._key);
    } else if (t.type === "link_close") {
      const i = marks.findLastIndex((m) => markDefs.some((d) => d._key === m));
      if (i >= 0) marks.splice(i, 1);
    } else if (t.type === "text") push(t.content);
    else if (t.type === "code_inline") push(t.content, ["code"]);
    else if (t.type === "softbreak") push(" ");
    else if (t.type === "hardbreak") push("\n");
    else if (t.type === "image") errors.push(`${where}: an image sits inside a sentence. Put each image on its own line.`);
  }
  return { children: out.length ? out : [{ _type: "span" as const, _key: key(), text: "", marks: [] }], markDefs };
}

/** "tsx title="app/page.tsx"" to a language and an optional file name. */
function fenceInfo(info: string) {
  const lang = info.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const title = /title=(?:"([^"]+)"|'([^']+)')/.exec(info);
  return { lang, filename: title ? (title[1] ?? title[2]) : undefined };
}

function embedBlock(code: string, key: () => string, errors: string[]): ContentBlock | null {
  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const url = lines[0] ?? "";
  const caption = lines.find((l) => /^caption:/i.test(l))?.replace(/^caption:\s*/i, "");
  let host = "";
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") throw new Error("not https");
    host = u.hostname.replace(/^www\./, "");
  } catch {
    errors.push(`Embed: "${url}" is not an https:// link.`);
    return null;
  }
  const provider = EMBED_HOSTS.find(([re]) => re.test(host))?.[1];
  if (!provider) {
    errors.push(`Embed: ${host} is not supported (YouTube, Vimeo, X/Twitter, CodePen, CodeSandbox).`);
    return null;
  }
  return { _type: "embed", _key: key(), url, provider, ...(caption ? { caption } : {}) };
}

/** Finds the token that closes the one at `start` (same nesting level). */
function closing(tokens: Token[], start: number): number {
  const close = tokens[start].type.replace(/_open$/, "_close");
  let depth = 0;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i].type === tokens[start].type) depth++;
    else if (tokens[i].type === close && --depth === 0) return i;
  }
  return tokens.length - 1;
}

export function convertBody(body: string, key: () => string = newKey) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const content: ContentBlock[] = [];
  const images: { key: string; src: string }[] = [];
  const tokens = md.parse(body, {});
  const lists: ("bullet" | "number")[] = [];
  let quote = false;
  let pendingCaption: string | undefined;

  const textBlock = (inline: Token, style: string, where: string): TextBlock => {
    const { children, markDefs } = spans(inline.children ?? [], key, errors, where);
    const block: TextBlock = { _type: "block", _key: key(), style, markDefs, children };
    if (lists.length) {
      block.listItem = lists.at(-1);
      block.level = lists.length;
    }
    return block;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const line = t.map ? `line ${t.map[0] + 1}` : "the article";
    switch (t.type) {
      case "heading_open": {
        const inline = tokens[i + 1];
        let level = Number(t.tag.slice(1));
        if (level === 1) {
          errors.push(`${line}: "# ${inline.content}" uses one #. The title goes in the fields at the top; use ## for sections.`);
          level = 2;
        }
        if (level > 4) {
          warnings.push(`${line}: heading level ${level} shown as ####.`);
          level = 4;
        }
        content.push(textBlock(inline, `h${level}`, line));
        i += 2;
        break;
      }
      case "bullet_list_open":
        lists.push("bullet");
        break;
      case "ordered_list_open":
        lists.push("number");
        break;
      case "bullet_list_close":
      case "ordered_list_close":
        lists.pop();
        break;
      case "blockquote_open": {
        const end = closing(tokens, i);
        const first = tokens.slice(i, end).find((x) => x.type === "inline");
        const marker = first ? /^\[!(\w+)\]\s*/.exec(first.content) : null;
        if (marker) {
          const type = CALLOUTS[marker[1].toUpperCase()];
          if (!type) errors.push(`${line}: [!${marker[1]}] is not a box type (TIP, NOTE, WARNING, CAUTION).`);
          const text = tokens
            .slice(i, end)
            .filter((x) => x.type === "inline")
            .map((x) => plainText(x.children))
            .join("\n\n")
            .replace(/^\[!\w+\]\s*/, "")
            .trim();
          if (tokens.slice(i, end).some((x) => x.type === "fence" || x.type.endsWith("list_open"))) {
            warnings.push(`${line}: a box can hold only text; its code or list became plain text.`);
          }
          if (type) content.push({ _type: "callout", _key: key(), type, text });
          i = end;
        } else quote = true;
        break;
      }
      case "blockquote_close":
        quote = false;
        break;
      case "paragraph_open": {
        const inline = tokens[i + 1];
        const kids = (inline.children ?? []).filter((c) => !(c.type === "softbreak" || (c.type === "text" && !c.content.trim())));
        if (kids.length && kids.every((c) => c.type === "image")) {
          for (const img of kids) {
            const alt = plainText(img.children).trim();
            const src = img.attrGet("src") ?? "";
            const caption = img.attrGet("title")?.trim();
            if (!alt) errors.push(`${line}: the image ${src} has no description in the [ ].`);
            else if (alt.length > LIMITS.alt) warnings.push(`${line}: the description of ${src} is ${alt.length} characters (best under ${LIMITS.alt}).`);
            const block: ImageBlock = { _type: "image", _key: key(), alt, size: "full", alignment: "center", ...(caption ? { caption } : {}) };
            content.push(block);
            images.push({ key: block._key, src });
          }
        } else if (!lists.length && !quote && /^Table:\s*/i.test(inline.content) && tokens[i + 3]?.type === "table_open") {
          pendingCaption = plainText(inline.children).replace(/^Table:\s*/i, "").trim();
        } else {
          content.push(textBlock(inline, quote ? "blockquote" : "normal", line));
        }
        i += 2;
        break;
      }
      case "fence": {
        const { lang, filename } = fenceInfo(t.info);
        const code = t.content.replace(/\n$/, "");
        if (lang === "embed") {
          const block = embedBlock(code, key, errors);
          if (block) content.push(block);
          break;
        }
        const language = LANGUAGE_ALIASES[lang] ?? lang;
        if (!lang) errors.push(`${line}: a code block has no language (\`\`\`tsx, \`\`\`bash, ...).`);
        else if (!LANGUAGES.has(language)) errors.push(`${line}: code language "${lang}" is not supported.`);
        content.push({ _type: "code", _key: key(), language: LANGUAGES.has(language) ? language : "markdown", code, ...(filename ? { filename } : {}) });
        break;
      }
      case "code_block":
        errors.push(`${line}: code indented with spaces. Put it in a \`\`\` block with its language.`);
        break;
      case "hr":
        content.push({ _type: "divider", _key: key(), style: "plain" });
        break;
      case "table_open": {
        const end = closing(tokens, i);
        const rows: { _key: string; cells: string[] }[] = [];
        let row: string[] | null = null;
        let hasHeader = false;
        for (let j = i; j < end; j++) {
          const x = tokens[j];
          if (x.type === "thead_open") hasHeader = true;
          else if (x.type === "tr_open") row = [];
          else if (x.type === "inline" && row) row.push(plainText(x.children).trim());
          else if (x.type === "tr_close" && row) {
            rows.push({ _key: key(), cells: row });
            row = null;
          }
        }
        content.push({ _type: "table", _key: key(), hasHeader, rows, ...(pendingCaption ? { caption: pendingCaption } : {}) });
        pendingCaption = undefined;
        i = end;
        break;
      }
      case "html_block":
        warnings.push(`${line}: HTML is shown as plain text.`);
        break;
    }
  }
  return { content, images, errors, warnings };
}

/** The whole file: fields at the top, then the article. */
export function convertGuestArticle(source: string, key: () => string = newKey): Converted {
  const parts = splitFrontMatter(source);
  if (!parts) {
    return {
      meta: null,
      content: [],
      images: [],
      errors: ['The file must start with the fields between two "---" lines, as in the template.'],
      warnings: [],
    };
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  const meta = readMeta(parts.yaml, errors, warnings);
  const body = convertBody(parts.body, key);
  errors.push(...body.errors);
  warnings.push(...body.warnings);
  if (/\[AUTHOR:/i.test(parts.body)) errors.push("An [AUTHOR: ...] note is still in the text.");
  const content: ContentBlock[] = meta?.lead ? [{ _type: "lead", _key: key(), text: meta.lead }, ...body.content] : body.content;
  if (!body.content.length) errors.push("The article has no text.");
  return { meta, content, images: body.images, errors, warnings };
}

/** Image formats the site serves, by their first bytes rather than the file name. */
export function imageKind(bytes: Uint8Array): "png" | "jpg" | "webp" | "gif" | null {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "webp";
  if (b.length >= 6 && /^GIF8[79]a$/.test(String.fromCharCode(...b.slice(0, 6)))) return "gif";
  return null;
}
