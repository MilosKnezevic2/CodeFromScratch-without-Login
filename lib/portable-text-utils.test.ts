import { describe, expect, it } from "vitest";
import { groupHeadings, sectionIndexOf, type TocHeading } from "./portable-text-utils";

const h = (level: TocHeading["level"], id: string): TocHeading => ({ level, id, text: id });

describe("groupHeadings", () => {
  it("numbers the h2 sections and files the h3/h4 under them", () => {
    const sections = groupHeadings([h("h2", "a"), h("h3", "a1"), h("h4", "a2"), h("h2", "b"), h("h2", "c"), h("h3", "c1")]);
    expect(sections.map((s) => [s.num, s.id, s.subs.map((x) => x.id)])).toEqual([
      ["01", "a", ["a1", "a2"]],
      ["02", "b", []],
      ["03", "c", ["c1"]],
    ]);
  });

  it("keeps a subheading that comes before any h2", () => {
    expect(groupHeadings([h("h3", "intro"), h("h2", "a")]).map((s) => s.id)).toEqual(["intro", "a"]);
  });

  it("finds the section of the heading being read", () => {
    const sections = groupHeadings([h("h2", "a"), h("h2", "b"), h("h3", "b1")]);
    expect(sectionIndexOf(sections, "b1")).toBe(1);
    expect(sectionIndexOf(sections, "a")).toBe(0);
    expect(sectionIndexOf(sections, "")).toBe(-1);
  });
});
