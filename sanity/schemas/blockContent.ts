import { defineType, defineArrayMember, defineField } from "sanity";

const EMBED_PROVIDERS = [
  { title: "YouTube", value: "youtube" },
  { title: "Vimeo", value: "vimeo" },
  { title: "Twitter / X", value: "twitter" },
  { title: "CodePen", value: "codepen" },
  { title: "CodeSandbox", value: "codesandbox" },
  { title: "Generic iframe", value: "iframe" },
];

export const blockContent = defineType({
  name: "blockContent",
  title: "Block Content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Underline", value: "underline" },
          { title: "Code", value: "code" },
          { title: "Strikethrough", value: "strike-through" },
          { title: "Highlight", value: "highlight" },
          { title: "Center", value: "center" },
          { title: "Right", value: "right" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              {
                name: "href",
                type: "url",
                title: "URL",
                validation: (Rule) =>
                  Rule.uri({
                    allowRelative: true,
                    scheme: ["http", "https", "mailto"],
                  }).required(),
              },
              {
                name: "blank",
                type: "boolean",
                title: "Open in new tab",
                initialValue: true,
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: "image",
      options: {
        hotspot: true,
        aiAssist: { imageDescriptionField: "alt" },
      },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt Text",
          description: "Required — describe the image for screen readers and SEO. Keep under 125 characters.",
          validation: (Rule) =>
            Rule.required().min(3).max(125).warning(
              "Alt text helps screen-reader users and SEO. 3-125 characters works best.",
            ),
        }),
        defineField({
          name: "caption",
          type: "string",
          title: "Caption",
          description: "Optional caption shown below the image.",
        }),
        defineField({
          name: "size",
          type: "string",
          title: "Size",
          options: {
            list: [
              { title: "Small (40%)", value: "small" },
              { title: "Medium (70%)", value: "medium" },
              { title: "Full Width", value: "full" },
            ],
          },
          initialValue: "full",
        }),
        defineField({
          name: "alignment",
          type: "string",
          title: "Alignment",
          options: {
            list: [
              { title: "Left", value: "left" },
              { title: "Center", value: "center" },
              { title: "Right", value: "right" },
            ],
          },
          initialValue: "center",
        }),
      ],
    }),
    defineArrayMember({
      name: "code",
      title: "Code Block",
      type: "object",
      fields: [
        defineField({
          name: "language",
          title: "Language",
          type: "string",
          options: {
            list: [
              "javascript",
              "typescript",
              "python",
              "html",
              "css",
              "json",
              "bash",
              "jsx",
              "tsx",
              "sql",
              "go",
              "rust",
              "java",
              "csharp",
              "php",
              "ruby",
              "yaml",
              "markdown",
            ],
          },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "code",
          title: "Code",
          type: "text",
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: "filename",
          title: "Filename",
          type: "string",
          description: "Optional — shown as a label above the code (e.g. components/Button.tsx).",
        }),
      ],
      preview: {
        select: { language: "language", filename: "filename", code: "code" },
        prepare({ language, filename, code }) {
          const subtitle = filename ? `${filename}` : language ?? "code";
          const text =
            typeof code === "string" ? code.split("\n")[0]?.slice(0, 60) ?? "" : "";
          return { title: text || `Code: ${language ?? ""}`, subtitle };
        },
      },
    }),
    defineArrayMember({
      name: "callout",
      title: "Callout",
      type: "object",
      fields: [
        defineField({
          name: "type",
          title: "Type",
          type: "string",
          options: {
            list: [
              { title: "Info", value: "info" },
              { title: "Warning", value: "warning" },
              { title: "Tip", value: "tip" },
              { title: "Error", value: "error" },
            ],
            layout: "radio",
          },
          initialValue: "info",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "text",
          title: "Text",
          type: "text",
          rows: 3,
          validation: (Rule) => Rule.required().min(1),
        }),
      ],
      preview: {
        select: { type: "type", text: "text" },
        prepare({ type, text }) {
          return {
            title: typeof text === "string" ? text.slice(0, 80) : "",
            subtitle: `Callout · ${type ?? "info"}`,
          };
        },
      },
    }),
    defineArrayMember({
      name: "lead",
      title: "Lead / TL;DR",
      type: "object",
      description:
        "Pinned summary that appears above the article body. Great for showing readers what they'll learn in 2-3 sentences.",
      fields: [
        defineField({
          name: "text",
          title: "Lead text",
          type: "text",
          rows: 3,
          validation: (Rule) => Rule.required().min(20).max(400),
        }),
      ],
      preview: {
        select: { text: "text" },
        prepare({ text }) {
          return {
            title: typeof text === "string" ? text.slice(0, 80) : "",
            subtitle: "Lead / TL;DR",
          };
        },
      },
    }),
    defineArrayMember({
      name: "embed",
      title: "Embed",
      type: "object",
      fields: [
        defineField({
          name: "url",
          title: "URL",
          type: "url",
          description:
            "Paste the share link. Supported: YouTube, Vimeo, Twitter / X, CodePen, CodeSandbox. For anything else, choose 'Generic iframe' below.",
          validation: (Rule) =>
            Rule.required().uri({ scheme: ["https"] }),
        }),
        defineField({
          name: "provider",
          title: "Provider",
          type: "string",
          options: { list: EMBED_PROVIDERS, layout: "radio" },
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "caption",
          title: "Caption",
          type: "string",
          description: "Optional caption shown below the embed.",
        }),
      ],
      preview: {
        select: { url: "url", provider: "provider", caption: "caption" },
        prepare({ url, provider, caption }) {
          return {
            title: typeof caption === "string" && caption.length > 0 ? caption : url ?? "",
            subtitle: `Embed · ${provider ?? "—"}`,
          };
        },
      },
    }),
    defineArrayMember({
      name: "table",
      title: "Table",
      type: "object",
      fields: [
        defineField({
          name: "caption",
          title: "Caption",
          type: "string",
          description: "Shown above the table (optional).",
        }),
        defineField({
          name: "rows",
          title: "Rows",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "row",
              fields: [
                defineField({
                  name: "cells",
                  title: "Cells",
                  type: "array",
                  of: [defineArrayMember({ type: "string" })],
                  validation: (Rule) => Rule.required().min(1),
                }),
              ],
              preview: {
                select: { cells: "cells" },
                prepare({ cells }) {
                  return {
                    title: Array.isArray(cells) ? cells.join(" | ") : "",
                  };
                },
              },
            }),
          ],
          validation: (Rule) =>
            Rule.required()
              .min(1)
              .custom((rows) => {
                if (!Array.isArray(rows) || rows.length === 0) return true;
                const widths = rows.map((r) => {
                  const cells = (r as { cells?: unknown[] }).cells;
                  return Array.isArray(cells) ? cells.length : 0;
                });
                const allEqual = widths.every((w) => w === widths[0]);
                return allEqual
                  ? true
                  : "All rows must have the same number of cells. Currently: " +
                      widths.join(", ");
              }),
        }),
        defineField({
          name: "hasHeader",
          title: "First row is header",
          type: "boolean",
          initialValue: true,
        }),
      ],
      preview: {
        select: { rows: "rows", caption: "caption" },
        prepare({ rows, caption }) {
          const rowCount = Array.isArray(rows) ? rows.length : 0;
          return {
            title:
              typeof caption === "string" && caption.length > 0
                ? caption
                : `Table (${rowCount} row${rowCount === 1 ? "" : "s"})`,
            subtitle: "Table",
          };
        },
      },
    }),
    defineArrayMember({
      name: "divider",
      title: "Divider",
      type: "object",
      fields: [
        defineField({
          name: "style",
          title: "Style",
          type: "string",
          options: {
            list: [
              { title: "Plain line", value: "plain" },
              { title: "Decorative", value: "decorative" },
              { title: "Dotted", value: "dotted" },
            ],
            layout: "radio",
          },
          initialValue: "plain",
        }),
      ],
      preview: {
        select: { style: "style" },
        prepare({ style }) {
          return { title: `— Divider (${style ?? "plain"}) —` };
        },
      },
    }),
  ],
});
