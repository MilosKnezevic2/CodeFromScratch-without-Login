/**
 * Pure helpers for adding in-text links to a published article's Portable
 * Text body without touching anything else in it. Used by
 * scripts/add-links.mjs; kept free of I/O so the tests can run them.
 *
 * Two operations:
 *  - linkExisting: turn words that are already in the text into a link.
 *  - appendSentence: add one sentence at the end of a paragraph, with
 *    [anchor](slug) links inside it.
 */

const HEADING = /^h[1-6]$/;

/** The /blog/<slug> targets this body already links to. */
export function linkedSlugs(content) {
  const slugs = new Set();
  for (const block of content) {
    for (const def of block.markDefs ?? []) {
      const match = /^\/blog\/([a-z0-9-]+)/.exec(def.href ?? "");
      if (def._type === "link" && match) slugs.add(match[1]);
    }
  }
  return slugs;
}

function isProse(block) {
  return block._type === "block" && !HEADING.test(block.style ?? "");
}

function blockText(block) {
  return (block.children ?? []).map((c) => c.text ?? "").join("");
}

function linkKeys(block) {
  return new Set((block.markDefs ?? []).filter((d) => d._type === "link").map((d) => d._key));
}

/** The first prose block whose text contains `needle`, or an error naming what was searched. */
function findBlock(content, needle) {
  const index = content.findIndex((b) => isProse(b) && blockText(b).includes(needle));
  if (index === -1) throw new Error(`no paragraph contains "${needle}"`);
  return index;
}

/**
 * Links the first occurrence of `anchor` inside the first paragraph that
 * contains `near` (defaults to the anchor itself). The anchor has to sit
 * inside one span: words split across bold/code formatting, or words that
 * are already a link, are refused rather than guessed at.
 */
export function linkExisting(content, { anchor, near = anchor, href }, makeKey) {
  const index = findBlock(content, near);
  const block = content[index];
  const text = blockText(block);
  const nearAt = text.indexOf(near);
  const from = near.includes(anchor) ? nearAt + near.indexOf(anchor) : text.indexOf(anchor);
  if (from === -1) throw new Error(`"${anchor}" is not in the paragraph with "${near}"`);
  const to = from + anchor.length;

  const links = linkKeys(block);
  let offset = 0;
  for (const [i, span] of block.children.entries()) {
    const end = offset + (span.text ?? "").length;
    if (from >= offset && from < end) {
      if (span._type !== "span" || to > end) throw new Error(`"${anchor}" crosses formatting; pick other words`);
      if (span.marks?.some((m) => links.has(m))) throw new Error(`"${anchor}" is already a link`);
      const marks = span.marks ?? [];
      const before = span.text.slice(0, from - offset);
      const after = span.text.slice(to - offset);
      const defKey = makeKey();
      const pieces = [
        ...(before ? [{ ...span, text: before }] : []),
        { _type: "span", _key: before ? makeKey() : span._key, text: anchor, marks: [...marks, defKey] },
        ...(after ? [{ _type: "span", _key: makeKey(), text: after, marks: [...marks] }] : []),
      ];
      return replaceAt(content, index, {
        ...block,
        markDefs: [...(block.markDefs ?? []), { _type: "link", _key: defKey, href }],
        children: [...block.children.slice(0, i), ...pieces, ...block.children.slice(i + 1)],
      });
    }
    offset = end;
  }
  throw new Error(`"${anchor}" was not found in the spans`);
}

/**
 * Appends one sentence to the end of the first paragraph that contains
 * `after`. Links are written inline as [anchor](slug).
 */
export function appendSentence(content, { after, text }, makeKey) {
  const parts = [...text.matchAll(/\[([^\]]+)\]\(([a-z0-9-]+)\)/g)];
  if (parts.length === 0) throw new Error(`sentence "${text}" has no [anchor](slug) link`);
  const index = findBlock(content, after);
  const block = content[index];
  const existing = blockText(block);
  const newSpans = [];
  const newDefs = [];
  let cursor = 0;
  const lead = /\s$/.test(existing) ? "" : " ";
  for (const part of parts) {
    const plain = text.slice(cursor, part.index);
    if (plain || (cursor === 0 && lead)) {
      newSpans.push({ _type: "span", _key: makeKey(), text: (cursor === 0 ? lead : "") + plain, marks: [] });
    }
    const defKey = makeKey();
    newDefs.push({ _type: "link", _key: defKey, href: `/blog/${part[2]}` });
    newSpans.push({ _type: "span", _key: makeKey(), text: part[1], marks: [defKey] });
    cursor = part.index + part[0].length;
  }
  const tail = text.slice(cursor);
  if (tail) newSpans.push({ _type: "span", _key: makeKey(), text: tail, marks: [] });
  const next = {
    ...block,
    markDefs: [...(block.markDefs ?? []), ...newDefs],
    children: [...block.children, ...newSpans],
  };
  return replaceAt(content, index, next);
}

/** The slugs an [anchor](slug) sentence links to. */
export function sentenceTargets(text) {
  return [...text.matchAll(/\[[^\]]+\]\(([a-z0-9-]+)\)/g)].map((m) => m[1]);
}

/** Plain text of the paragraph a change landed in, with links shown as [text](href), for review. */
export function previewBlock(block) {
  const hrefs = new Map((block.markDefs ?? []).map((d) => [d._key, d.href]));
  return (block.children ?? [])
    .map((c) => {
      const href = c.marks?.map((m) => hrefs.get(m)).find(Boolean);
      return href ? `[${c.text}](${href})` : c.text;
    })
    .join("");
}

function replaceAt(content, index, block) {
  return [...content.slice(0, index), block, ...content.slice(index + 1)];
}
