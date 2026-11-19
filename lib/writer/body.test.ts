import { describe, expect, it } from "vitest";
import { imagesWithoutAlt, safeHref, sanitizeBody, toBody, wordCount } from "./body";

const span = (text: string, marks: string[] = [], _key = "s1") => ({ _type: "span", _key, text, marks });
const para = (children: unknown[], extra: Record<string, unknown> = {}) => ({ _type: "block", _key: "b1", style: "normal", markDefs: [], children, ...extra });

describe("safeHref", () => {
  it("accepts web, email and site links", () => {
    expect(safeHref("https://developer.mozilla.org")).toBe("https://developer.mozilla.org");
    expect(safeHref("mailto:office@codefromscratch.org")).toBe("mailto:office@codefromscratch.org");
    expect(safeHref("/blog/some-post")).toBe("/blog/some-post");
    expect(safeHref("#section")).toBe("#section");
  });

  it("refuses script, data and protocol-relative links", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull();
    expect(safeHref("data:text/html,<b>x</b>")).toBeNull();
    expect(safeHref("//evil.example")).toBeNull();
    expect(safeHref("not a url")).toBeNull();
  });
});

describe("sanitizeBody", () => {
  it("keeps what the editor produces and drops fields it does not know", () => {
    const result = sanitizeBody([
      para([span("Hello", ["strong", "l1"])], { markDefs: [{ _type: "link", _key: "l1", href: "https://example.com", onclick: "x" }], extra: 1 }),
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        {
          _type: "block",
          _key: "b1",
          style: "normal",
          markDefs: [{ _type: "link", _key: "l1", href: "https://example.com", blank: true }],
          children: [span("Hello", ["strong", "l1"])],
        },
      ],
    });
  });

  it("strips unknown marks and unknown styles", () => {
    const result = sanitizeBody([para([span("x", ["blink"])], { style: "h1" })]);
    expect(result).toMatchObject({ ok: true, value: [{ style: "normal", children: [{ marks: [] }] }] });
  });

  it("refuses a link that is not a web or email address", () => {
    const result = sanitizeBody([para([span("x", ["l1"])], { markDefs: [{ _type: "link", _key: "l1", href: "javascript:alert(1)" }] })]);
    expect(result).toMatchObject({ ok: false });
  });

  it("refuses block types outside the site's schema", () => {
    expect(sanitizeBody([{ _type: "html", _key: "h1", html: "<script>" }])).toMatchObject({ ok: false });
    expect(sanitizeBody([{ _type: "image", _key: "i1", asset: { _ref: "x" } }])).toMatchObject({ ok: false });
  });

  it("accepts an uploaded raster image and refuses an SVG asset", () => {
    const ref = `image-${"a".repeat(40)}-1200x630-png`;
    expect(sanitizeBody([{ _type: "image", _key: "i1", asset: { _ref: ref }, alt: " A chart ", size: "huge", hotspot: {} }])).toEqual({
      ok: true,
      value: [{ _type: "image", _key: "i1", asset: { _type: "reference", _ref: ref }, alt: "A chart", size: "full", alignment: "center" }],
    });
    expect(sanitizeBody([{ _type: "image", _key: "i1", asset: { _ref: `image-${"a".repeat(40)}-10x10-svg` } }])).toMatchObject({ ok: false });
  });

  it("refuses duplicate or malformed keys", () => {
    expect(sanitizeBody([para([span("a")]), para([span("b")])])).toMatchObject({ ok: false });
    expect(sanitizeBody([{ ...para([span("a")]), _key: "has space" }])).toMatchObject({ ok: false });
  });

  it("limits list levels and fixes object fields to known values", () => {
    const result = sanitizeBody([
      para([span("item")], { listItem: "bullet", level: 9 }),
      { _type: "code", _key: "c1", language: "brainfuck", code: "x", filename: "  a.js  " },
      { _type: "callout", _key: "k1", type: "rainbow", text: "Careful" },
      { _type: "livePreview", _key: "d1", html: "<p>hi</p>", height: 5000 },
      { _type: "divider", _key: "v1", style: "zigzag" },
    ]);
    expect(result).toMatchObject({
      ok: true,
      value: [
        { listItem: "bullet", level: 3 },
        { _type: "code", language: "javascript", filename: "a.js" },
        { _type: "callout", type: "tip" },
        { _type: "livePreview", height: 900, html: "<p>hi</p>" },
        { _type: "divider", style: "plain" },
      ],
    });
  });

  it("refuses an oversized body", () => {
    const huge = Array.from({ length: 2001 }, (_, i) => ({ ...para([span("x")]), _key: `b${i}` }));
    expect(sanitizeBody(huge)).toMatchObject({ ok: false });
  });
});

describe("toBody and wordCount", () => {
  it("counts text and box words, not code", () => {
    const body = toBody([
      para([span("one two "), span("three", [], "s2")]),
      { _type: "code", _key: "c1", language: "js", code: "const a = 1;" },
      { _type: "callout", _key: "k1", type: "tip", text: "four five" },
    ]);
    expect(wordCount(body)).toBe(5);
  });

  it("finds images without a description", () => {
    const ref = `image-${"b".repeat(40)}-800x600-jpg`;
    const body = toBody([
      { _type: "image", _key: "i1", asset: { _ref: ref } },
      { _type: "image", _key: "i2", asset: { _ref: ref }, alt: "Login form" },
    ]);
    expect(imagesWithoutAlt(body)).toBe(1);
  });

  it("reads an unreadable stored body as empty", () => {
    expect(toBody("not an array")).toEqual([]);
  });
});
