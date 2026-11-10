import { describe, expect, it } from "vitest";
import { devtoTags, escapeText, toMarkdown, type ContentBlock, type MarkdownOptions } from "./markdown";

const opts: MarkdownOptions = {
  siteUrl: "https://codefromscratch.org",
  articleUrl: "https://codefromscratch.org/blog/demo",
  target: "devto",
};

const p = (text: string, extra: Partial<Extract<ContentBlock, { _type: "block" }>> = {}): ContentBlock => ({
  _type: "block",
  style: "normal",
  markDefs: [],
  children: [{ _type: "span", text, marks: [] }],
  ...extra,
});

describe("toMarkdown", () => {
  it("renders headings, paragraphs and marks", () => {
    const md = toMarkdown(
      [
        p("Grid", { style: "h2" }),
        {
          _type: "block",
          style: "normal",
          markDefs: [{ _key: "l1", _type: "link", href: "/blog/css-grid" }],
          children: [
            { _type: "span", text: "Use ", marks: [] },
            { _type: "span", text: "display: grid", marks: ["code"] },
            { _type: "span", text: " and read ", marks: [] },
            { _type: "span", text: "the guide ", marks: ["strong", "l1"] },
          ],
        },
      ],
      opts,
    );
    expect(md).toBe(
      "## Grid\n\nUse `display: grid` and read [**the guide**](https://codefromscratch.org/blog/css-grid) \n",
    );
  });

  it("escapes prose that Markdown or HTML would interpret", () => {
    expect(escapeText("a <div> and *stars* [x]")).toBe("a &lt;div> and \\*stars\\* \\[x\\]");
    expect(toMarkdown([p("# not a heading")], opts)).toBe("\\# not a heading\n");
  });

  it("groups list items and numbers nested levels", () => {
    const li = (text: string, listItem: "bullet" | "number", level = 1) => p(text, { listItem, level });
    const md = toMarkdown(
      [li("one", "number"), li("two", "number"), li("inner", "bullet", 2), li("three", "number"), p("after")],
      opts,
    );
    expect(md).toBe("1. one\n2. two\n   - inner\n3. three\n\nafter\n");
  });

  it("fences code longer than any backtick run inside it and labels the file", () => {
    const md = toMarkdown([{ _type: "code", language: "js", filename: "app.js", code: "const s = ```;\n" }], opts);
    expect(md).toBe("`app.js`\n\n````js\nconst s = ```;\n````\n");
  });

  it("protects Liquid-looking code on dev.to only", () => {
    const block: ContentBlock = { _type: "code", language: "html", code: "<p>{{ name }}</p>" };
    expect(toMarkdown([block], opts)).toBe("{% raw %}\n```html\n<p>{{ name }}</p>\n```\n{% endraw %}\n");
    expect(toMarkdown([block], { ...opts, target: "plain" })).toBe("```html\n<p>{{ name }}</p>\n```\n");
  });

  it("turns live previews into a link back to the article", () => {
    const md = toMarkdown([{ _type: "livePreview", title: "The finished table" }], opts);
    expect(md).toContain("**Live demo:** The finished table.");
    expect(md).toContain("(https://codefromscratch.org/blog/demo)");
    expect(md.startsWith("> ")).toBe(true);
  });

  it("renders callouts, tables, images, embeds and dividers", () => {
    const md = toMarkdown(
      [
        { _type: "callout", type: "warning", text: "Line one\nLine two" },
        { _type: "table", hasHeader: true, rows: [{ cells: ["A", "B|C"] }, { cells: ["1"] }] },
        { _type: "image", url: "https://cdn.sanity.io/x.png", alt: "Cards", caption: "Three plans" },
        { _type: "embed", url: "https://youtu.be/x", provider: "youtube" },
        { _type: "divider" },
      ],
      opts,
    );
    expect(md).toBe(
      [
        "> **Warning:** Line one\n> Line two",
        "| A | B\\|C |\n| --- | --- |\n| 1 |  |",
        "![Cards](https://cdn.sanity.io/x.png)\n_Three plans_",
        "{% embed https://youtu.be/x %}",
        "---",
      ].join("\n\n") + "\n",
    );
  });

  it("refuses block types it does not know instead of dropping them", () => {
    const unknown = { _type: "quiz" } as unknown as ContentBlock;
    expect(() => toMarkdown([unknown], opts)).toThrow('No Markdown rule for block type "quiz"');
  });
});

describe("devtoTags", () => {
  it("keeps webdev, maps our slugs and drops unknown ones", () => {
    expect(devtoTags(["css", "web-design-principles", "html", "javascript"])).toEqual(["webdev", "css", "design", "html"]);
    expect(devtoTags(["next-js", "something-niche"])).toEqual(["webdev", "nextjs"]);
  });

  it("makes room for beginners on beginner articles", () => {
    expect(devtoTags(["css", "html", "javascript"], "beginner")).toEqual(["webdev", "css", "html", "beginners"]);
    expect(devtoTags(["css"], "beginner")).toEqual(["webdev", "css", "beginners"]);
  });
});
