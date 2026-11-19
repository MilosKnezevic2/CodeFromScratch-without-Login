import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { convertBody, convertGuestArticle, imageKind, safeHref, slugify, type ContentBlock, type TextBlock } from "./guest-article";

function keys() {
  let n = 0;
  return () => `k${++n}`;
}

const front = (extra = "") => `---
title: "How to Cancel Stale Fetch Requests in React"
excerpt: "Old search results can overwrite new ones. Here is why it happens and how AbortController fixes it."
lead: "You will learn why fast typing can show the wrong results, and how to fix it."
difficulty: intermediate
tags: [react, fetch]
author:
  name: "Olivia Bennett"
  bio: "Olivia builds search interfaces for a living and writes about the bugs she meets."
  photo: "images/author.jpg"
  github: "https://github.com/olivia-b"
  linkedin: "https://www.linkedin.com/in/olivia-bennett/"
  twitter: ""
  website: ""
${extra}---
`;

const text = (b: ContentBlock | undefined) => (b && b._type === "block" ? b.children.map((c) => c.text).join("") : "");

describe("the template from brand-brain/guest-authors", () => {
  const template = readFileSync(join(__dirname, "guest-template.md"), "utf8");
  const result = convertGuestArticle(template, keys());

  it("converts every element it shows, with no errors except the placeholder name", () => {
    expect(result.errors).toEqual(['author.name is still "Your Name" from the template.']);
    const types = new Set(result.content.map((b) => b._type));
    for (const t of ["lead", "block", "code", "callout", "image", "table", "embed", "divider"]) expect(types).toContain(t);
  });

  it("keeps the four box types apart", () => {
    const callouts = result.content.filter((b) => b._type === "callout").map((b) => (b._type === "callout" ? b.type : ""));
    expect(callouts).toEqual(["tip", "info", "warning", "error"]);
  });
});

describe("convertGuestArticle", () => {
  it("reads the fields and puts the lead first", () => {
    const r = convertGuestArticle(front() + "\nIntro paragraph.\n", keys());
    expect(r.errors).toEqual([]);
    expect(r.meta).toMatchObject({
      title: "How to Cancel Stale Fetch Requests in React",
      difficulty: "intermediate",
      tags: ["react", "fetch"],
      author: { name: "Olivia Bennett", github: "olivia-b", linkedin: "olivia-bennett", photo: "images/author.jpg" },
    });
    expect(r.meta?.author.twitter).toBeUndefined();
    expect(r.content[0]).toMatchObject({ _type: "lead", text: r.meta?.lead });
    expect(text(r.content[1])).toBe("Intro paragraph.");
  });

  it("refuses a file without the fields, fields out of range and leftover AI notes", () => {
    expect(convertGuestArticle("Just text").errors[0]).toMatch(/must start with the fields/);
    const r = convertGuestArticle(front().replace("How to Cancel Stale Fetch Requests in React", "Short") + "\nText [AUTHOR: add a number].\n");
    expect(r.errors).toContain("title: 5 characters, needs 10-120.");
    expect(r.errors).toContain("An [AUTHOR: ...] note is still in the text.");
  });

  it("does not change the author's words", () => {
    const body = "It's *really* **not** a `bug` -- \"quoted\" ... ok?\n";
    const r = convertGuestArticle(front() + body, keys());
    expect(text(r.content[1])).toBe("It's really not a bug -- \"quoted\" ... ok?");
  });
});

describe("convertBody", () => {
  it("turns marks and links into spans and link definitions", () => {
    const { content, errors } = convertBody("A **bold** and [MDN](https://developer.mozilla.org/) link.", keys());
    expect(errors).toEqual([]);
    const block = content[0] as TextBlock;
    expect(block.markDefs).toEqual([{ _type: "link", _key: expect.any(String), href: "https://developer.mozilla.org/", blank: true }]);
    expect(block.children.map((c) => [c.text, c.marks.length])).toEqual([["A ", 0], ["bold", 1], [" and ", 0], ["MDN", 1], [" link.", 0]]);
    expect(block.children[3].marks).toEqual([block.markDefs[0]._key]);
  });

  it("refuses unsafe links instead of keeping them", () => {
    const { errors } = convertBody("[x](javascript:alert(1)) and [y](//evil.example)", keys());
    expect(errors.length).toBeGreaterThan(0);
  });

  it("keeps nested lists with their level", () => {
    const { content } = convertBody("- one\n  - inner\n- two\n\n1. first\n2. second\n", keys());
    expect(content.map((b) => (b._type === "block" ? [b.listItem, b.level, text(b)] : null))).toEqual([
      ["bullet", 1, "one"],
      ["bullet", 2, "inner"],
      ["bullet", 1, "two"],
      ["number", 1, "first"],
      ["number", 1, "second"],
    ]);
  });

  it("keeps code exactly, with its language and file name", () => {
    const code = "if (a) {\n    return `x`;\n}";
    const { content } = convertBody(`\`\`\`ts title="lib/a.ts"\n${code}\n\`\`\`\n`, keys());
    expect(content[0]).toEqual({ _type: "code", _key: "k1", language: "typescript", code, filename: "lib/a.ts" });
  });

  it("asks for a language on every code block", () => {
    expect(convertBody("```\nx\n```\n").errors[0]).toMatch(/no language/);
    expect(convertBody("```cobol\nx\n```\n").errors[0]).toMatch(/not supported/);
    expect(convertBody("    indented code\n").errors[0]).toMatch(/indented/);
  });

  it("needs a description on every image and keeps the caption", () => {
    const ok = convertBody('![A chart of requests](images/01-chart.png "Requests per second")\n', keys());
    expect(ok.content[0]).toMatchObject({ _type: "image", alt: "A chart of requests", caption: "Requests per second" });
    expect(ok.images).toEqual([{ key: "k1", src: "images/01-chart.png" }]);
    expect(convertBody("![](images/a.png)\n").errors[0]).toMatch(/no description/);
    expect(convertBody("Look ![chart](images/a.png) here\n").errors[0]).toMatch(/inside a sentence/);
  });

  it("refuses embeds from sites the page cannot show", () => {
    expect(convertBody("```embed\nhttps://youtu.be/abc\ncaption: Demo\n```\n", keys()).content[0]).toMatchObject({ provider: "youtube", caption: "Demo" });
    expect(convertBody("```embed\nhttps://evil.example/x\n```\n").errors[0]).toMatch(/not supported/);
  });

  it("reads a table with its caption and header", () => {
    const { content } = convertBody("Table: Two ways\n\n| A | B |\n| - | - |\n| `1` | 2 |\n", keys());
    expect(content).toEqual([{ _type: "table", _key: expect.any(String), caption: "Two ways", hasHeader: true, rows: [expect.objectContaining({ cells: ["A", "B"] }), expect.objectContaining({ cells: ["1", "2"] })] }]);
  });

  it("tells one # apart from the section headings", () => {
    expect(convertBody("# Title again\n").errors[0]).toMatch(/one #/);
    expect(convertBody("## Section\n\n#### Small\n", keys()).content.map((b) => (b._type === "block" ? b.style : ""))).toEqual(["h2", "h4"]);
  });

  it("keeps a normal quote as a quote", () => {
    const { content } = convertBody("> Quoted text.\n", keys());
    expect(content[0]).toMatchObject({ _type: "block", style: "blockquote" });
  });
});

describe("helpers", () => {
  it("makes the same slug as the site", () => {
    expect(slugify("How to Cancel Stale Fetch Requests in React")).toBe("how-to-cancel-stale-fetch-requests-in-react");
    expect(slugify("Ćevapi & Café: 2 ways")).toBe("cevapi-cafe-2-ways");
  });

  it("accepts only safe links", () => {
    expect(safeHref("/blog/x")).toBe("/blog/x");
    expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("images/a.png")).toBeNull();
  });

  it("recognises image files by their bytes, not their names", () => {
    expect(imageKind(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(imageKind(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
  });
});
