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
