/**
 * The Writer desk's Markdown dialect, turned into the Portable Text blocks the
 * article page renders. Runs in the browser (the live preview) and on the
 * server (what is stored and later published), so it has no Node imports.
 *
 * Supported, and nothing else (anything unknown stays a plain paragraph):
 *   ## Heading / ### Subheading
 *   **bold**, *italic*, `code`, [text](https://link)
 *   - bullet / 1. numbered list items
 *   > quote
 *   > [!TIP] / > [!WARNING] / > [!INFO] callout (text on the same or next lines)
 *   ```js file.js  … ```          code block, optional file name after the language
 *   ```demo … ```                 live demo: "title: …", "height: 400", then
 *                                 "--- html", "--- css", "--- js" sections
 *   ---                           divider
 */

export type Span = { _type: "span"; _key: string; text: string; marks: string[] };
export type LinkDef = { _type: "link"; _key: string; href: string };
export type TextBlock = {
  _type: "block";
  _key: string;
  style: "normal" | "h2" | "h3" | "blockquote";
  listItem?: "bullet" | "number";
  level?: number;
  markDefs: LinkDef[];
  children: Span[];
};
export type CodeBlockValue = { _type: "code"; _key: string; language: string; code: string; filename?: string };
export type CalloutValue = { _type: "callout"; _key: string; type: "tip" | "warning" | "info"; text: string };
export type DemoValue = { _type: "livePreview"; _key: string; title?: string; html?: string; css?: string; js?: string; height?: number };
export type DividerValue = { _type: "divider"; _key: string; style: "plain" };
export type WriterBlock = TextBlock | CodeBlockValue | CalloutValue | DemoValue | DividerValue;

const CALLOUT = /^>\s*\[!(TIP|WARNING|INFO|NOTE)\]\s*(.*)$/i;
const SAFE_LINK = /^(https?:\/\/|\/|#|mailto:)/i;

/** Deterministic keys: the same text gives the same keys, so React keeps the preview stable while typing. */
function keyMaker() {
  let n = 0;
  return () => `w${(n++).toString(36)}`;
}

/** Inline marks: **bold**, *italic*, `code`, [text](href). Unclosed markers stay as typed. */
export function parseInline(text: string, key: () => string): { children: Span[]; markDefs: LinkDef[] } {
  const children: Span[] = [];
  const markDefs: LinkDef[] = [];
  const pattern = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  const push = (t: string, marks: string[] = []) => {
    if (t) children.push({ _type: "span", _key: key(), text: t, marks });
  };
  for (const m of text.matchAll(pattern)) {
    push(text.slice(last, m.index));
    if (m[2] !== undefined) push(m[2], ["strong"]);
    else if (m[4] !== undefined) push(m[4], ["em"]);
    else if (m[6] !== undefined) push(m[6], ["code"]);
    else if (m[8] !== undefined) {
      const href = m[9];
      if (SAFE_LINK.test(href)) {
        const def: LinkDef = { _type: "link", _key: key(), href };
        markDefs.push(def);
        push(m[8], [def._key]);
      } else {
        // javascript: and other schemes are shown as text, never as a link.
        push(m[0]);
      }
    }
    last = (m.index ?? 0) + m[0].length;
  }
  push(text.slice(last));
  if (children.length === 0) push(" ");
  return { children, markDefs };
}

function textBlock(text: string, key: () => string, style: TextBlock["style"], list?: TextBlock["listItem"]): TextBlock {
  const { children, markDefs } = parseInline(text, key);
  return { _type: "block", _key: key(), style, markDefs, children, ...(list ? { listItem: list, level: 1 } : {}) };
}

function parseDemo(body: string, key: () => string): DemoValue {
  const demo: DemoValue = { _type: "livePreview", _key: key() };
  let section: "html" | "css" | "js" | null = null;
  const parts: Record<"html" | "css" | "js", string[]> = { html: [], css: [], js: [] };
  for (const line of body.split("\n")) {
    const marker = line.match(/^---\s*(html|css|js)\s*$/i);
    if (marker) {
      section = marker[1].toLowerCase() as "html" | "css" | "js";
      continue;
    }
    if (!section) {
      const title = line.match(/^title:\s*(.+)$/i);
      const height = line.match(/^height:\s*(\d{2,4})\s*$/i);
      if (title) demo.title = title[1].trim();
      if (height) demo.height = Math.min(1200, Math.max(120, Number(height[1])));
      continue;
    }
    parts[section].push(line);
  }
  for (const s of ["html", "css", "js"] as const) {
    const code = parts[s].join("\n").trim();
    if (code) demo[s] = code;
  }
  return demo;
}

/** Turns the writer's Markdown into article blocks. Never throws: bad input becomes paragraphs. */
export function markdownToBlocks(markdown: string): WriterBlock[] {
  const key = keyMaker();
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const out: WriterBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(textBlock(para.join(" ").trim(), key, "normal"));
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const fence = trimmed.match(/^```\s*([\w+-]*)\s*(\S*)\s*$/);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i].trim())) body.push(lines[i++]);
      const lang = (fence[1] || "text").toLowerCase();
      if (lang === "demo") out.push(parseDemo(body.join("\n"), key));
      else out.push({ _type: "code", _key: key(), language: lang, code: body.join("\n"), ...(fence[2] ? { filename: fence[2] } : {}) });
      continue;
    }

    if (!trimmed) {
      flush();
      continue;
    }

    const heading = trimmed.match(/^(#{2,3})\s+(.+)$/);
    if (heading) {
      flush();
      out.push(textBlock(heading[2], key, heading[1] === "##" ? "h2" : "h3"));
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flush();
      out.push({ _type: "divider", _key: key(), style: "plain" });
      continue;
    }

    const callout = trimmed.match(CALLOUT);
    if (callout) {
      flush();
      const text = [callout[2]];
      while (i + 1 < lines.length && /^>/.test(lines[i + 1].trim()) && !CALLOUT.test(lines[i + 1].trim())) {
        text.push(lines[++i].trim().replace(/^>\s?/, ""));
      }
      const kind = callout[1].toLowerCase();
      out.push({ _type: "callout", _key: key(), type: kind === "note" ? "info" : (kind as CalloutValue["type"]), text: text.join(" ").trim() });
      continue;
    }

    if (/^>/.test(trimmed)) {
      flush();
      const text = [trimmed.replace(/^>\s?/, "")];
      while (i + 1 < lines.length && /^>/.test(lines[i + 1].trim())) text.push(lines[++i].trim().replace(/^>\s?/, ""));
      out.push(textBlock(text.join(" "), key, "blockquote"));
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      flush();
      out.push(textBlock(bullet[1], key, "normal", "bullet"));
      continue;
    }
    const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (numbered) {
      flush();
      out.push(textBlock(numbered[1], key, "normal", "number"));
      continue;
    }

    para.push(trimmed);
  }
  flush();
  return out;
}

/** Plain-text word count of the Markdown, for the editor's status bar. */
export function wordCount(markdown: string): number {
  return markdown.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}
