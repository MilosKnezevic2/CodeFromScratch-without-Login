import { defineSchema } from "@portabletext/editor";
import { DECORATORS, LISTS, STYLES } from "@/lib/writer/body";

/** The editor's schema: the author-facing subset of Sanity's `blockContent`, field for field. */
export const schemaDefinition = defineSchema({
  styles: STYLES.map((name) => ({ name })),
  decorators: DECORATORS.map((name) => ({ name })),
  lists: LISTS.map((name) => ({ name })),
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }, { name: "blank", type: "boolean" }] }],
  blockObjects: [
    { name: "code", fields: [{ name: "language", type: "string" }, { name: "code", type: "string" }, { name: "filename", type: "string" }] },
    { name: "callout", fields: [{ name: "type", type: "string" }, { name: "text", type: "string" }] },
    {
      name: "livePreview",
      fields: [
        { name: "title", type: "string" },
        { name: "html", type: "string" },
        { name: "css", type: "string" },
        { name: "js", type: "string" },
        { name: "height", type: "number" },
      ],
    },
    { name: "divider", fields: [{ name: "style", type: "string" }] },
    {
      name: "image",
      fields: [
        { name: "asset", type: "object" },
        { name: "alt", type: "string" },
        { name: "caption", type: "string" },
        { name: "size", type: "string" },
        { name: "alignment", type: "string" },
      ],
    },
  ],
  inlineObjects: [],
});

export const STYLE_LABEL: Record<(typeof STYLES)[number], string> = {
  normal: "Paragraph",
  h2: "Heading",
  h3: "Subheading",
  h4: "Small heading",
  blockquote: "Quote",
};
