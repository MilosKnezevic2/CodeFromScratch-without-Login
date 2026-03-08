import { defineType, defineArrayMember } from "sanity";

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
                  Rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto"] }),
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
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alt Text",
        },
        {
          name: "caption",
          type: "string",
          title: "Caption",
        },
        {
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
        },
        {
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
        },
      ],
    }),
    defineArrayMember({
      name: "code",
      title: "Code Block",
      type: "object",
      fields: [
        {
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
        },
        {
          name: "code",
          title: "Code",
          type: "text",
        },
        {
          name: "filename",
          title: "Filename",
          type: "string",
        },
      ],
    }),
    defineArrayMember({
      name: "callout",
      title: "Callout",
      type: "object",
      fields: [
        {
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
          },
        },
        {
          name: "text",
          title: "Text",
          type: "text",
        },
      ],
    }),
  ],
});
