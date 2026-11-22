import { describe, expect, it } from "vitest";
import { repointLinks } from "./merge-links.mjs";

const para = (href: string) => ({
  _type: "block",
  style: "normal",
  markDefs: [
    { _key: "a", _type: "link", href },
    { _key: "b", _type: "link", href: "/blog/other" },
  ],
  children: [
    { _type: "span", text: "See ", marks: [] },
    { _type: "span", text: "the guide", marks: ["a", "strong"] },
    { _type: "span", text: " and ", marks: [] },
    { _type: "span", text: "this", marks: ["b"] },
  ],
});

describe("repointLinks", () => {
  it("points links to the old article at the article it merged into", () => {
    const { content, repointed, unlinked } = repointLinks([para("/blog/old-guide#env")], {
      from: "old-guide",
      into: "big-guide",
      self: false,
    });
    expect(content[0].markDefs?.map((d: { href?: string }) => d.href)).toEqual(["/blog/big-guide#env", "/blog/other"]);
    expect([repointed, unlinked]).toEqual([1, 0]);
  });

  it("removes the link inside the merged-into article and keeps the words and other marks", () => {
    const { content, unlinked } = repointLinks([para("/blog/old-guide")], { from: "old-guide", into: "big-guide", self: true });
    expect(content[0].markDefs?.map((d: { _key: string }) => d._key)).toEqual(["b"]);
    expect(content[0].children?.[1]).toEqual({ _type: "span", text: "the guide", marks: ["strong"] });
    expect(content[0].children?.[3].marks).toEqual(["b"]);
    expect(unlinked).toBe(1);
  });

  it("leaves slugs that only start with the old slug alone", () => {
    const blocks = [para("/blog/old-guide-part-two")];
    const result = repointLinks(blocks, { from: "old-guide", into: "big-guide", self: false });
    expect(result.content[0]).toBe(blocks[0]);
    expect(result.repointed).toBe(0);
  });
});
