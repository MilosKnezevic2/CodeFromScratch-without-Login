import { describe, expect, it } from "vitest";
import { blockText, buildBlocks, inline, insertBlocks, linkedArticleSlugs } from "./insert-blocks.mjs";

function keys() {
  let n = 0;
  return () => `k${++n}`;
}

type Block = { _type: string; _key: string; style?: string; children?: { text: string; marks: string[] }[]; markDefs?: { href: string }[] };

const para = (key: string, text: string): Block => ({ _type: "block", _key: key, style: "normal", markDefs: [], children: [{ text, marks: [] }] });
const head = (key: string, text: string): Block => ({ _type: "block", _key: key, style: "h2", markDefs: [], children: [{ text, marks: [] }] });

describe("inline", () => {
  it("turns bold, code and links into marks and link definitions", () => {
    const { children, markDefs } = inline("Use **4.3** with `@variant`, see [notes](https://github.com/x) and [grid](css-grid).", keys());

    expect(children.map((c: { text: string }) => c.text).join("")).toBe("Use 4.3 with @variant, see notes and grid.");
    expect(children.find((c: { text: string }) => c.text === "4.3").marks).toEqual(["strong"]);
    expect(children.find((c: { text: string }) => c.text === "@variant").marks).toEqual(["code"]);
    expect(markDefs.map((d: { href: string }) => d.href)).toEqual(["https://github.com/x", "/blog/css-grid"]);
  });

  it("refuses a link that is neither https nor a slug", () => {
    expect(() => inline("[x](http://insecure.example)", keys())).toThrow(/neither an https address/);
  });
});

describe("buildBlocks", () => {
  it("builds headings, paragraphs, bullets and a table", () => {
    const blocks = buildBlocks(
      [
        { t: "h3", text: "Vercel vs Jenkins" },
        { t: "p", text: "Two jobs." },
        { t: "bullet", items: ["one", "two"] },
        { t: "table", caption: "At a glance", rows: [["", "A"], ["x", "y"]] },
      ],
      keys(),
    );

    expect(blocks.map((b: Block) => b.style ?? b._type)).toEqual(["h3", "normal", "normal", "normal", "table"]);
    expect(blocks[4]).toMatchObject({ caption: "At a glance", hasHeader: true, rows: [{ cells: ["", "A"] }, { cells: ["x", "y"] }] });
  });

  it("refuses a table with uneven rows", () => {
    expect(() => buildBlocks([{ t: "table", rows: [["a", "b"], ["c"]] }], keys())).toThrow(/same number of cells/);
  });
});

describe("insertBlocks", () => {
  const content = [para("a", "First paragraph."), head("h", "The decision rule"), para("b", "Last.")];
  const extra = [para("new", "Inserted.")];

  it("inserts after the paragraph that contains the text, keeping every other block", () => {
    const out = insertBlocks(content, { after: "First" }, extra);
    expect(out.map((b: Block) => b._key)).toEqual(["a", "new", "h", "b"]);
    expect(out[0]).toBe(content[0]);
  });

  it("inserts before an exact heading", () => {
    const out = insertBlocks(content, { beforeHeading: "The decision rule" }, extra);
    expect(out.map((b: Block) => b._key)).toEqual(["a", "new", "h", "b"]);
  });

  it("refuses when the place is not found", () => {
    expect(() => insertBlocks(content, { after: "missing" }, extra)).toThrow(/no paragraph/);
    expect(() => insertBlocks(content, { beforeHeading: "The decision" }, extra)).toThrow(/no heading/);
  });
});

describe("linkedArticleSlugs and blockText", () => {
  it("lists only article links and reads table text", () => {
    const blocks = buildBlocks([{ t: "p", text: "[a](zod-at-trust-boundaries) [b](https://x.dev)" }, { t: "table", rows: [["Neon", "Supabase"]] }], keys());
    expect(linkedArticleSlugs(blocks)).toEqual(["zod-at-trust-boundaries"]);
    expect(blockText(blocks[1])).toBe("Neon Supabase");
  });
});
