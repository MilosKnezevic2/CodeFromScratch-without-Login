/**
 * Turns a published article's Portable Text into Markdown for cross-posting
 * (dev.to first; the output is plain enough to paste into Hashnode or Medium).
 *
 * Every block type in sanity/schemas/blockContent.ts has a rule here. An
 * unknown type throws instead of disappearing, so a cross-post never loses a
 * section silently. Live previews cannot run off-site, so they become a link
 * back to the original article, which is also where the reader should go.
 */

export interface Span {
  _type: "span";
  text: string;
  marks?: string[];
}

export interface MarkDef {
  _key: string;
  _type: string;
  href?: string;
}

export interface TextBlock {
  _type: "block";
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  markDefs?: MarkDef[];
  children: Span[];
}

export interface CodeBlock {
  _type: "code";
  language?: string;
  code?: string;
  filename?: string;
}

export interface ImageBlock {
  _type: "image";
  url?: string;
  alt?: string;
  caption?: string;
}

export interface LivePreviewBlock {
  _type: "livePreview";
  title?: string;
}

export interface CalloutBlock {
  _type: "callout";
  type?: string;
  text?: string;
}

export interface LeadBlock {
  _type: "lead";
  text?: string;
}

export interface EmbedBlock {
  _type: "embed";
  url?: string;
  provider?: string;
  caption?: string;
}

export interface TableBlock {
  _type: "table";
  caption?: string;
  hasHeader?: boolean;
  rows?: { cells?: string[] }[];
}

export interface DividerBlock {
  _type: "divider";
}

export type ContentBlock =
  | TextBlock
  | CodeBlock
  | ImageBlock
  | LivePreviewBlock
  | CalloutBlock
  | LeadBlock
  | EmbedBlock
  | TableBlock
  | DividerBlock;

export interface MarkdownOptions {
  /** Site origin, used to make relative links absolute. No trailing slash. */
  siteUrl: string;
  /** Canonical URL of the original article (live demos link here). */
  articleUrl: string;
  /** dev.to parses Liquid tags, even inside code; protect them and use its embeds. */
  target: "devto" | "plain";
}

const CALLOUT_LABEL: Record<string, string> = {
  info: "Note",
  warning: "Warning",
  tip: "Tip",
  error: "Watch out",
};

/** Providers dev.to can embed with {% embed url %}. */
const DEVTO_EMBEDS = new Set(["youtube", "vimeo", "twitter", "codepen", "codesandbox"]);

export function absoluteUrl(href: string, siteUrl: string): string {
  if (href.startsWith("/")) return `${siteUrl}${href}`;
  if (href.startsWith("#")) return href;
  return href;
}

/** Escapes characters that Markdown or embedded HTML would interpret in prose. */
export function escapeText(text: string): string {
  return text.replace(/[\\`*_[\]<]/g, (c) => (c === "<" ? "&lt;" : `\\${c}`));
}

// dev.to turns "@word" in prose into a user mention and refuses an article with
// more than ten (HTTP 422). In our articles such words are code (CSS at-rules like
// @theme, npm scopes like @tailwindcss/vite), so on dev.to they become inline code.
// An e-mail address is preceded by a word character and is left alone.
const AT_WORD = /(?<![\w@./])@[A-Za-z0-9_][\w./-]*/g;

/** Prose text for the target: escaped, with @words as inline code on dev.to. */
function prose(text: string, opts: MarkdownOptions): string {
  if (opts.target !== "devto") return escapeText(text);
  let out = "";
  let last = 0;
  for (const m of text.matchAll(AT_WORD)) {
    const word = m[0].replace(/[./-]+$/, "");
    out += escapeText(text.slice(last, m.index)) + inlineCode(word);
    last = m.index + word.length;
  }
  return out + escapeText(text.slice(last));
}

/** Escapes a line start that Markdown would read as a heading, quote or list. */
function escapeLineStart(line: string): string {
  return line.replace(/^(\s*)(#{1,6}\s|>|[-+]\s|\d+\.\s)/, (_m, ws: string, tok: string) => `${ws}\\${tok}`);
}

function inlineCode(text: string): string {
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const ticks = "`".repeat(longest + 1);
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${ticks}${pad}${text}${pad}${ticks}`;
}

/** Wraps marker pairs around text, keeping outer whitespace outside (Markdown needs that). */
function wrap(text: string, open: string, close = open): string {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
  if (!m || m[2] === "") return text;
  return `${m[1]}${open}${m[2]}${close}${m[3]}`;
}

function renderSpans(block: TextBlock, opts: MarkdownOptions): string {
  const defs = new Map((block.markDefs ?? []).map((d) => [d._key, d]));
  return block.children
    .map((span) => {
      const marks = span.marks ?? [];
      let out = marks.includes("code") ? inlineCode(span.text) : prose(span.text, opts);
      if (marks.includes("strong")) out = wrap(out, "**");
      if (marks.includes("em")) out = wrap(out, "_");
      if (marks.includes("strike-through")) out = wrap(out, "~~");
      for (const mark of marks) {
        const def = defs.get(mark);
        if (def?._type === "link" && def.href) {
          out = wrap(out, "[", `](${absoluteUrl(def.href, opts.siteUrl)})`);
        }
      }
      return out;
    })
    .join("");
}

function hasLiquid(text: string): boolean {
  return /\{%|\{\{/.test(text);
}

function protectLiquid(md: string, opts: MarkdownOptions): string {
  if (opts.target !== "devto" || !hasLiquid(md)) return md;
  return `{% raw %}\n${md}\n{% endraw %}`;
}

function quote(text: string): string {
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? ">" : `> ${line}`))
    .join("\n");
}

function renderCode(block: CodeBlock, opts: MarkdownOptions): string {
  const code = (block.code ?? "").replace(/\s+$/, "");
  const longest = Math.max(2, ...[...code.matchAll(/`+/g)].map((m) => m[0].length));
  const fence = "`".repeat(longest + 1);
  const lang = block.language && block.language !== "text" ? block.language : "";
  const label = block.filename ? `${inlineCode(block.filename)}\n\n` : "";
  return `${label}${protectLiquid(`${fence}${lang}\n${code}\n${fence}`, opts)}`;
}

function renderTable(block: TableBlock, opts: MarkdownOptions): string {
  const rows = (block.rows ?? []).map((r) => (r.cells ?? []).map((c) => prose(c, opts).replace(/\|/g, "\\|").replace(/\n/g, " ")));
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array<string>(width - r.length).fill("")];
  const line = (r: string[]) => `| ${pad(r).join(" | ")} |`;
  const [head, ...body] = block.hasHeader === false ? [Array<string>(width).fill(" "), ...rows] : rows;
  const table = [line(head), `| ${Array<string>(width).fill("---").join(" | ")} |`, ...body.map(line)].join("\n");
  return block.caption ? `${table}\n\n_${prose(block.caption, opts)}_` : table;
}

function renderTextBlock(block: TextBlock, opts: MarkdownOptions): string {
  const text = renderSpans(block, opts);
  switch (block.style ?? "normal") {
    case "h1":
    case "h2":
      return `## ${text}`;
    case "h3":
      return `### ${text}`;
    case "h4":
    case "h5":
    case "h6":
      return `#### ${text}`;
    case "blockquote":
      return quote(text);
    default:
      return text.split("\n").map(escapeLineStart).join("  \n");
  }
}

function renderBlock(block: ContentBlock, opts: MarkdownOptions): string {
  switch (block._type) {
    case "block":
      return protectLiquid(renderTextBlock(block, opts), opts);
    case "lead":
      return protectLiquid(escapeLineStart(prose(block.text ?? "", opts)), opts);
    case "code":
      return renderCode(block, opts);
    case "callout": {
      const label = CALLOUT_LABEL[block.type ?? "info"] ?? "Note";
      return protectLiquid(quote(`**${label}:** ${prose(block.text ?? "", opts)}`), opts);
    }
    case "livePreview": {
      const title = block.title ? `${escapeText(block.title)}. ` : "";
      return quote(`**Live demo:** ${title}It runs right in the page, so [try it in the original article](${opts.articleUrl}).`);
    }
    case "image": {
      if (!block.url) return "";
      const img = `![${escapeText(block.alt ?? "")}](${block.url})`;
      return block.caption ? `${img}\n_${escapeText(block.caption)}_` : img;
    }
    case "embed": {
      if (!block.url) return "";
      const caption = block.caption ? `\n_${escapeText(block.caption)}_` : "";
      if (opts.target === "devto" && block.provider && DEVTO_EMBEDS.has(block.provider)) {
        return `{% embed ${block.url} %}${caption}`;
      }
      return `[${escapeText(block.caption ?? block.url)}](${block.url})`;
    }
    case "table":
      return renderTable(block, opts);
    case "divider":
      return "---";
    default: {
      const unknown: { _type?: string } = block;
      throw new Error(`No Markdown rule for block type "${unknown._type ?? "?"}"`);
    }
  }
}

function isListItem(block: ContentBlock): block is TextBlock & { listItem: "bullet" | "number" } {
  return block._type === "block" && Boolean(block.listItem);
}

/** Converts a whole article body. Consecutive list items form one list. */
export function toMarkdown(blocks: ContentBlock[], opts: MarkdownOptions): string {
  const parts: string[] = [];
  let list: string[] = [];
  let counters: number[] = [];

  const flushList = () => {
    if (list.length > 0) parts.push(list.join("\n"));
    list = [];
    counters = [];
  };

  for (const block of blocks) {
    if (isListItem(block)) {
      const level = Math.max(1, block.level ?? 1);
      counters = counters.slice(0, level);
      counters[level - 1] = (counters[level - 1] ?? 0) + 1;
      const indent = "   ".repeat(level - 1);
      const marker = block.listItem === "number" ? `${counters[level - 1]}.` : "-";
      list.push(protectLiquid(`${indent}${marker} ${renderSpans(block, opts)}`, opts));
      continue;
    }
    flushList();
    const md = renderBlock(block, opts);
    if (md !== "") parts.push(md);
  }
  flushList();
  return `${parts.join("\n\n")}\n`;
}

/** Popular dev.to tags we may map to; anything else is dropped (dev.to allows 4). */
const DEVTO_TAGS = new Set([
  "webdev", "javascript", "beginners", "tutorial", "programming", "react", "css", "html",
  "typescript", "node", "nextjs", "ai", "career", "productivity", "database", "postgres",
  "security", "testing", "devops", "git", "docker", "python", "api", "frontend", "backend",
  "tailwindcss", "learning", "performance", "a11y", "design", "vercel", "supabase",
  "prisma", "graphql", "go", "sql", "codenewbie", "architecture", "authentication",
]);

const TAG_ALIASES: Record<string, string> = {
  "next-js": "nextjs",
  "next.js": "nextjs",
  "tailwind-css": "tailwindcss",
  "tailwind": "tailwindcss",
  "postgresql": "postgres",
  "nodejs": "node",
  "node-js": "node",
  "ai-in-web-development": "ai",
  "accessibility": "a11y",
  "web-design-principles": "design",
  "auth": "authentication",
  "golang": "go",
};

/**
 * Picks up to four dev.to tags: "webdev" always, our tags mapped onto the
 * popular set, then "beginners" for beginner articles if there is room.
 */
export function devtoTags(tagSlugs: string[], difficulty?: string): string[] {
  const picked = ["webdev"];
  for (const slug of tagSlugs) {
    const s = slug.toLowerCase();
    const mapped = TAG_ALIASES[s] ?? s.replace(/[^a-z0-9]/g, "");
    if (DEVTO_TAGS.has(mapped) && !picked.includes(mapped)) picked.push(mapped);
  }
  if (difficulty === "beginner" && !picked.includes("beginners")) {
    if (picked.length >= 4) picked[3] = "beginners";
    else picked.push("beginners");
  }
  return picked.slice(0, 4);
}
