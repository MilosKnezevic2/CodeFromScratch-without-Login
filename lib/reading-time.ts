const WORDS_PER_MINUTE = 220;

type SpanChild = { _type: string; text?: string };

/**
 * Compute estimated reading time (minutes) from Portable Text blocks.
 *
 * Accepts `unknown[]` so both `@portabletext/react`'s and Sanity's
 * PortableTextBlock variants can be passed without a type cast.
 * Internal walkers are defensive — they shape-check every node.
 *
 * Strategy:
 *  - Sum word count from text spans inside paragraph/heading/list-item blocks.
 *  - Treat callout text and image captions as text too (they slow reading).
 *  - Code blocks and embeds count as a fixed +0.5 min each (people scan, don't
 *    read line-by-line).
 *  - Round up to the nearest minute, minimum 1.
 *
 * Centralised so the renderer, the post page, and the Studio reading-time
 * badge all agree on the number.
 */
export function calculateReadingTime(
  blocks: readonly unknown[] | null | undefined,
): number {
  if (!Array.isArray(blocks) || blocks.length === 0) return 1;

  let words = 0;
  let scannableBlocks = 0;

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const type = (block as { _type?: string })._type;

    if (type === "block") {
      const children = (block as { children?: SpanChild[] }).children;
      if (Array.isArray(children)) {
        for (const child of children) {
          if (typeof child?.text === "string") {
            words += countWords(child.text);
          }
        }
      }
      continue;
    }

    if (type === "callout" || type === "lead") {
      const text = (block as { text?: string }).text;
      if (typeof text === "string") words += countWords(text);
      continue;
    }

    if (type === "image") {
      const caption = (block as { caption?: string }).caption;
      if (typeof caption === "string") words += countWords(caption);
      continue;
    }

    if (type === "table") {
      const rows = (block as { rows?: { cells?: string[] }[] }).rows;
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (Array.isArray(row?.cells)) {
            for (const cell of row.cells) {
              if (typeof cell === "string") words += countWords(cell);
            }
          }
        }
      }
      continue;
    }

    if (type === "code" || type === "embed") {
      scannableBlocks += 1;
    }
  }

  const minutes = words / WORDS_PER_MINUTE + scannableBlocks * 0.5;
  return Math.max(1, Math.ceil(minutes));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
