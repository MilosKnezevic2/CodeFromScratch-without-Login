import type { PortableTextBlock } from "@portabletext/react";

export interface TocHeading {
  text: string;
  id: string;
  level: "h2" | "h3" | "h4";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function extractHeadings(content: PortableTextBlock[]): TocHeading[] {
  const headings: TocHeading[] = [];
  for (const block of content) {
    if (
      block._type === "block" &&
      (block.style === "h2" || block.style === "h3" || block.style === "h4")
    ) {
      const text = (block.children as { text: string }[])
        ?.map((c) => c.text)
        .join("") || "";
      if (text) {
        headings.push({ text, id: slugify(text), level: block.style as "h2" | "h3" | "h4" });
      }
    }
  }
  return headings;
}

export interface TocSection {
  id: string;
  text: string;
  /** "01", "02", ... */
  num: string;
  subs: { id: string; text: string }[];
}

/**
 * The contents list as numbered sections: every h2 starts one, the h3/h4
 * after it are its subheadings. A subheading before the first h2 counts as a
 * section of its own, so nothing is lost.
 */
export function groupHeadings(headings: TocHeading[]): TocSection[] {
  const sections: TocSection[] = [];
  for (const h of headings) {
    const last = sections.at(-1);
    if (h.level === "h2" || !last) {
      sections.push({ id: h.id, text: h.text, num: String(sections.length + 1).padStart(2, "0"), subs: [] });
    } else {
      last.subs.push({ id: h.id, text: h.text });
    }
  }
  return sections;
}

/** The section holding the heading being read (a section's own id or one of its subheadings), or -1. */
export function sectionIndexOf(sections: TocSection[], activeId: string): number {
  return sections.findIndex((s) => s.id === activeId || s.subs.some((sub) => sub.id === activeId));
}
