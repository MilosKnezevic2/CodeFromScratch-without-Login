/** Editor toolbar actions as pure text edits, so they are testable without a browser. */

export type Edit = { text: string; selStart: number; selEnd: number };

/** Wraps the selection (or a placeholder) in markers: **bold**, *italic*, `code`. */
export function wrap(text: string, start: number, end: number, before: string, after: string, placeholder: string): Edit {
  const picked = text.slice(start, end) || placeholder;
  const next = text.slice(0, start) + before + picked + after + text.slice(end);
  return { text: next, selStart: start + before.length, selEnd: start + before.length + picked.length };
}

/** Puts a prefix at the start of every selected line ("## ", "- ", "1. ", "> [!TIP] "). */
export function prefixLines(text: string, start: number, end: number, prefix: string | ((i: number) => string)): Edit {
  const lineStart = text.lastIndexOf("\n", start - 1) + 1;
  const lineEndRaw = text.indexOf("\n", end);
  const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
  const lines = text.slice(lineStart, lineEnd).split("\n");
  const changed = lines.map((l, i) => (typeof prefix === "function" ? prefix(i) : prefix) + l.replace(/^(#{2,3}\s+|[-*]\s+|\d+[.)]\s+|>\s*(\[![A-Z]+\]\s*)?)/i, "")).join("\n");
  const next = text.slice(0, lineStart) + changed + text.slice(lineEnd);
  return { text: next, selStart: lineStart, selEnd: lineStart + changed.length };
}

/** Inserts a block (code fence, demo, divider) on its own lines, with a blank line around it. */
export function insertBlock(text: string, start: number, end: number, block: string, cursorOffset: number): Edit {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const lead = before.length === 0 || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  const trail = after.startsWith("\n\n") || after.length === 0 ? "" : after.startsWith("\n") ? "\n" : "\n\n";
  const next = before + lead + block + trail + after;
  const caret = before.length + lead.length + cursorOffset;
  return { text: next, selStart: caret, selEnd: caret };
}

/** A link around the selection; the URL part is selected, ready to paste over. */
export function link(text: string, start: number, end: number): Edit {
  const label = text.slice(start, end) || "link text";
  const url = "https://";
  const next = text.slice(0, start) + `[${label}](${url})` + text.slice(end);
  const urlStart = start + label.length + 3;
  return { text: next, selStart: urlStart, selEnd: urlStart + url.length };
}

export const CODE_BLOCK = "```js file.js\n\n```";
export const DEMO_BLOCK = "```demo\ntitle: What the reader should try\nheight: 360\n--- html\n<button>Click me</button>\n--- css\nbutton { padding: 0.5rem 1rem; }\n--- js\ndocument.querySelector(\"button\").addEventListener(\"click\", () => alert(\"It works\"));\n```";
