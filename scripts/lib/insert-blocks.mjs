/**
 * Pure helpers for adding new blocks (a subheading with paragraphs, a list,
 * a table) to a published article's Portable Text body, leaving every
 * existing block untouched. Used by scripts/insert-blocks.mjs; free of I/O
 * so the tests can run them.
 *
 * Inline text uses a small markdown subset: **bold**, `code` and
 * [text](href), where href is an https:// address or an article slug.
 */

const HEADING = /^h[1-6]$/;
const INLINE = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

/** Turns one line of the markdown subset into Portable Text children and link definitions. */
export function inline(text, makeKey) {
  const children = [];
  const markDefs = [];
  let cursor = 0;
  const push = (value, marks) => {
    if (value) children.push({ _type: "span", _key: makeKey(), text: value, marks });
  };
  for (const match of text.matchAll(INLINE)) {
    push(text.slice(cursor, match.index), []);
    const [, bold, code, label, href] = match;
    if (bold) push(bold, ["strong"]);
    else if (code) push(code, ["code"]);
    else {
      if (!/^https:\/\//.test(href) && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(href)) {
        throw new Error(`link "${href}" is neither an https address nor an article slug`);
      }
      const defKey = makeKey();
      markDefs.push({ _type: "link", _key: defKey, href: href.startsWith("https://") ? href : `/blog/${href}` });
      push(label, [defKey]);
    }
    cursor = match.index + match[0].length;
  }
  push(text.slice(cursor), []);
  return { children, markDefs };
}

/** Builds Portable Text blocks from specs: h2, h3, p, bullet (items), table (rows). */
export function buildBlocks(specs, makeKey) {
  const out = [];
  for (const spec of specs) {
    switch (spec.t) {
      case "h2":
      case "h3":
        out.push({ _type: "block", _key: makeKey(), style: spec.t, markDefs: [], children: [{ _type: "span", _key: makeKey(), text: spec.text, marks: [] }] });
        break;
      case "p":
        out.push({ _type: "block", _key: makeKey(), style: "normal", ...inline(spec.text, makeKey) });
        break;
      case "bullet":
        for (const item of spec.items) {
          out.push({ _type: "block", _key: makeKey(), style: "normal", listItem: "bullet", level: 1, ...inline(item, makeKey) });
        }
        break;
      case "table": {
        const widths = new Set(spec.rows.map((r) => r.length));
        if (spec.rows.length === 0 || widths.size !== 1) throw new Error("table rows must all have the same number of cells");
        out.push({
          _type: "table",
          _key: makeKey(),
          ...(spec.caption ? { caption: spec.caption } : {}),
          hasHeader: spec.hasHeader ?? true,
          rows: spec.rows.map((cells) => ({ _type: "row", _key: makeKey(), cells })),
        });
        break;
      }
      default:
        throw new Error(`unknown block type "${spec.t}"`);
    }
  }
  return out;
}

export function blockText(block) {
  if (block._type === "table") return (block.rows ?? []).flatMap((r) => r.cells).join(" ");
  return (block.children ?? []).map((c) => c.text ?? "").join("");
}

/**
 * Inserts `blocks` right after the first paragraph containing `after`, or
 * right before the heading whose text is exactly `beforeHeading`.
 *
 * @template T
 * @param {T[]} content
 * @param {{ after?: string, beforeHeading?: string }} place
 * @param {T[]} blocks
 * @returns {T[]}
 */
export function insertBlocks(content, place, blocks) {
  const { after, beforeHeading } = place;
  let index;
  if (beforeHeading) {
    const at = content.findIndex((b) => b._type === "block" && HEADING.test(b.style ?? "") && blockText(b) === beforeHeading);
    if (at === -1) throw new Error(`no heading "${beforeHeading}"`);
    index = at;
  } else if (after) {
    const at = content.findIndex((b) => b._type === "block" && !HEADING.test(b.style ?? "") && blockText(b).includes(after));
    if (at === -1) throw new Error(`no paragraph contains "${after}"`);
    index = at + 1;
  } else {
    throw new Error("an insert needs `after` or `beforeHeading`");
  }
  return [...content.slice(0, index), ...blocks, ...content.slice(index)];
}

/** Article slugs that new blocks link to (outside links excluded). */
export function linkedArticleSlugs(blocks) {
  return blocks.flatMap((b) => (b.markDefs ?? []).map((d) => /^\/blog\/([a-z0-9-]+)$/.exec(d.href)?.[1]).filter(Boolean));
}
