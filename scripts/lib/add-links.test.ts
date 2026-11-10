import { describe, expect, it } from "vitest";
import { appendSentence, linkExisting, linkedSlugs, previewBlock, sentenceTargets } from "./add-links.mjs";

type Span = { _type: "span"; _key: string; text: string; marks: string[] };
type Block = {
  _type: string;
  _key: string;
  style?: string;
  markDefs?: { _type: string; _key: string; href?: string }[];
  children?: Span[];
};

function keys() {
  let n = 0;
  return () => `k${++n}`;
}

function paragraph(key: string, ...texts: (string | [string, string[]])[]): Block {
  return {
    _type: "block",
    _key: key,
    style: "normal",
    markDefs: [],
    children: texts.map((t, i) =>
      typeof t === "string"
        ? { _type: "span", _key: `${key}s${i}`, text: t, marks: [] }
        : { _type: "span", _key: `${key}s${i}`, text: t[0], marks: t[1] },
    ),
  };
}

const heading: Block = {
  _type: "block",
  _key: "h",
  style: "h2",
  markDefs: [],
  children: [{ _type: "span", _key: "hs", text: "Rate limiting", marks: [] }],
};

describe("linkExisting", () => {
  it("links words in the middle of a span and keeps the text identical", () => {
    const content = [heading, paragraph("p", "Add rate limiting before launch.")];
    const out = linkExisting(content, { anchor: "rate limiting", href: "/blog/api-rate-limiting-nextjs" }, keys()) as Block[];

    expect(previewBlock(out[1])).toBe("Add [rate limiting](/blog/api-rate-limiting-nextjs) before launch.");
    expect(out[0]).toBe(heading);
    expect(content[1].children).toHaveLength(1);
  });

  it("uses `near` to pick the right paragraph and the occurrence inside it", () => {
    const content = [paragraph("a", "Grid is great."), paragraph("b", "Use Grid when the layout decides.")];
    const out = linkExisting(content, { anchor: "Grid", near: "Use Grid when", href: "/blog/x" }, keys()) as Block[];

    expect(previewBlock(out[0])).toBe("Grid is great.");
    expect(previewBlock(out[1])).toBe("Use [Grid](/blog/x) when the layout decides.");
  });

  it("keeps bold or code marks on the linked words", () => {
    const content = [paragraph("p", "Run ", ["prisma migrate deploy", ["code"]], " in CI.")];
    const out = linkExisting(content, { anchor: "migrate deploy", href: "/blog/x" }, keys()) as Block[];
    const linked = out[0].children!.find((c) => c.text === "migrate deploy")!;

    expect(linked.marks).toContain("code");
    expect(linked.marks).toHaveLength(2);
  });

  it("refuses words that cross formatting or are already a link", () => {
    const crossing = [paragraph("p", "plain ", ["bold", ["strong"]])];
    expect(() => linkExisting(crossing, { anchor: "plain bold", href: "/blog/x" }, keys())).toThrow(/crosses formatting/);

    const linked: Block[] = [
      {
        ...paragraph("p", ["already linked", ["d1"]]),
        markDefs: [{ _type: "link", _key: "d1", href: "/blog/y" }],
      },
    ];
    expect(() => linkExisting(linked, { anchor: "linked", href: "/blog/x" }, keys())).toThrow(/already a link/);
  });

  it("never links inside a heading", () => {
    expect(() => linkExisting([heading], { anchor: "Rate limiting", href: "/blog/x" }, keys())).toThrow(/no paragraph/);
  });
});

describe("appendSentence", () => {
  it("adds the sentence with a space and turns [anchor](slug) into links", () => {
    const content = [paragraph("p", "Learn the three patterns.")];
    const out = appendSentence(
      content,
      { after: "three patterns", text: "Then try the [pricing table](pricing-table-from-scratch-css)." },
      keys(),
    ) as Block[];

    expect(previewBlock(out[0])).toBe(
      "Learn the three patterns. Then try the [pricing table](/blog/pricing-table-from-scratch-css).",
    );
    expect(out[0].markDefs).toHaveLength(1);
  });

  it("refuses a sentence without a link", () => {
    expect(() => appendSentence([paragraph("p", "Text.")], { after: "Text", text: "No link here." }, keys())).toThrow(
      /no \[anchor\]/,
    );
  });
});

describe("linkedSlugs and sentenceTargets", () => {
  it("lists the articles a body already links to, ignoring outside links", () => {
    const content: Block[] = [
      {
        ...paragraph("p", "x"),
        markDefs: [
          { _type: "link", _key: "a", href: "/blog/zod-at-trust-boundaries#why" },
          { _type: "link", _key: "b", href: "https://nextjs.org/docs" },
        ],
      },
    ];
    expect([...linkedSlugs(content)]).toEqual(["zod-at-trust-boundaries"]);
    expect(sentenceTargets("See [a](one) and [b](two-three).")).toEqual(["one", "two-three"]);
  });
});
