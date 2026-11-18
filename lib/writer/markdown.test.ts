import { describe, expect, it } from "vitest";
import { markdownToBlocks, wordCount, type TextBlock } from "./markdown";

const text = (b: TextBlock) => b.children.map((c) => c.text).join("");

describe("markdownToBlocks", () => {
  it("turns headings, paragraphs and lists into text blocks", () => {
    const blocks = markdownToBlocks("## Why it breaks\n\nFirst line\nsame paragraph.\n\n### Detail\n- one\n- two\n1. first") as TextBlock[];
    expect(blocks.map((b) => [b.style, b.listItem ?? null, text(b)])).toEqual([
      ["h2", null, "Why it breaks"],
      ["normal", null, "First line same paragraph."],
      ["h3", null, "Detail"],
      ["normal", "bullet", "one"],
      ["normal", "bullet", "two"],
      ["normal", "number", "first"],
    ]);
  });

  it("marks bold, italic, inline code and links", () => {
    const [b] = markdownToBlocks("Use **const**, *not* `var`, see [MDN](https://developer.mozilla.org).") as TextBlock[];
    expect(b.children.map((c) => [c.text, c.marks])).toEqual([
      ["Use ", []],
      ["const", ["strong"]],
      [", ", []],
      ["not", ["em"]],
      [" ", []],
      ["var", ["code"]],
      [", see ", []],
      ["MDN", [b.markDefs[0]._key]],
      [".", []],
    ]);
    expect(b.markDefs[0].href).toBe("https://developer.mozilla.org");
  });

  it("never turns a javascript: URL into a link", () => {
    const [b] = markdownToBlocks("[click](javascript:alert(1))") as TextBlock[];
    expect(b.markDefs).toEqual([]);
    expect(text(b)).toContain("javascript:");
  });

  it("reads fenced code with an optional file name, keeping the code exactly", () => {
    const [code] = markdownToBlocks("```js search.js\nconst a = 1;\n\n  indented();\n```");
    expect(code).toMatchObject({ _type: "code", language: "js", filename: "search.js", code: "const a = 1;\n\n  indented();" });
  });

  it("reads callouts, including GitHub's NOTE and continuation lines", () => {
    const blocks = markdownToBlocks("> [!TIP] Debounce\n> the input.\n\n> [!NOTE] Heads up\n\n> just a quote");
    expect(blocks).toMatchObject([
      { _type: "callout", type: "tip", text: "Debounce the input." },
      { _type: "callout", type: "info", text: "Heads up" },
      { _type: "block", style: "blockquote" },
    ]);
  });

  it("builds a live demo from its sections and clamps the height", () => {
    const [demo] = markdownToBlocks("```demo\ntitle: Broken search\nheight: 9000\n--- html\n<input>\n--- css\ninput{width:100%}\n--- js\nconsole.log(1)\n```");
    expect(demo).toMatchObject({ _type: "livePreview", title: "Broken search", height: 1200, html: "<input>", css: "input{width:100%}", js: "console.log(1)" });
  });

  it("gives the same keys for the same text, so the preview does not remount while typing", () => {
    expect(markdownToBlocks("## A\n\nb")).toEqual(markdownToBlocks("## A\n\nb"));
  });

  it("keeps an unclosed fence as code instead of losing the rest", () => {
    const blocks = markdownToBlocks("intro\n\n```js\nconst x = 1;");
    expect(blocks[1]).toMatchObject({ _type: "code", code: "const x = 1;" });
  });
});

describe("wordCount", () => {
  it("counts words outside code fences", () => {
    expect(wordCount("Two words\n\n```js\nconst ignored = true;\n```\n\nand three more")).toBe(5);
  });
});
