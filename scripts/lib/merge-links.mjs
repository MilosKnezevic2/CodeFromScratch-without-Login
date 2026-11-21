/**
 * Pure helper for merging one article into another: every in-text link to
 * the old address is pointed at the article it was merged into. Inside that
 * article a link to the old address would become a link to itself, so there
 * the link is removed and its words stay as plain text. Kept free of I/O so
 * the tests can run it; used by scripts/merge-post.mjs.
 */

const hrefTo = (slug) => new RegExp(`^/blog/${slug}(?=$|[#?])`);

/**
 * @param {Array<{_type: string, markDefs?: Array<{_key: string, _type: string, href?: string}>, children?: Array<{marks?: string[]}>}>} content
 * @param {{from: string, into: string, self: boolean}} merge  self: content belongs to the `into` article
 * @returns {{content: typeof content, repointed: number, unlinked: number}}
 */
export function repointLinks(content, { from, into, self }) {
  const old = hrefTo(from);
  let repointed = 0;
  let unlinked = 0;
  const next = content.map((block) => {
    const hits = (block.markDefs ?? []).filter((d) => d._type === "link" && old.test(d.href ?? ""));
    if (hits.length === 0) return block;
    if (!self) {
      repointed += hits.length;
      return {
        ...block,
        markDefs: block.markDefs.map((d) => (hits.includes(d) ? { ...d, href: d.href.replace(old, `/blog/${into}`) } : d)),
      };
    }
    unlinked += hits.length;
    const dropped = new Set(hits.map((d) => d._key));
    return {
      ...block,
      markDefs: block.markDefs.filter((d) => !dropped.has(d._key)),
      children: (block.children ?? []).map((c) =>
        c.marks?.some((m) => dropped.has(m)) ? { ...c, marks: c.marks.filter((m) => !dropped.has(m)) } : c,
      ),
    };
  });
  return { content: next, repointed, unlinked };
}
