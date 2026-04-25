import { defineField, defineType } from "sanity";
import { makeCharCounter } from "../components/CharCounterInput";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ExcerptCounter = makeCharCounter({
  sweetMin: 120,
  sweetMax: 200,
  max: 280,
  hint: "Listing preview",
});
const SeoTitleCounter = makeCharCounter({
  sweetMin: 50,
  sweetMax: 60,
  max: 70,
  hint: "Google title",
});
const SeoDescriptionCounter = makeCharCounter({
  sweetMin: 120,
  sweetMax: 160,
  max: 170,
  hint: "Google description",
});

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "30-70 characters works best for SEO and social shares.",
      validation: (Rule) =>
        Rule.required()
          .min(10)
          .max(120)
          .warning("Aim for 30-70 characters."),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Auto-generated from the title — lowercase letters, digits, and dashes only.",
      options: {
        source: "title",
        maxLength: 96,
        slugify: (input) =>
          input
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 96),
      },
      validation: (Rule) =>
        Rule.required().custom((value) => {
          const slug =
            typeof value === "object" && value && "current" in value
              ? (value as { current?: string }).current
              : undefined;
          if (!slug) return "Slug is required.";
          if (!SLUG_PATTERN.test(slug)) {
            return "Slug must contain only lowercase letters, digits, and single dashes.";
          }
          return true;
        }),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "reference",
      to: [{ type: "author" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "text",
      rows: 3,
      description:
        "1-2 sentences (120-200 chars). Shown in listings; falls back as meta description.",
      options: {
        aiAssist: { translateAction: false },
      },
      components: { input: ExcerptCounter.TextVariant },
      validation: (Rule) =>
        Rule.required()
          .min(60)
          .max(280)
          .warning("Aim for 120-200 characters for the best listing previews."),
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      type: "image",
      options: {
        hotspot: true,
        aiAssist: {
          imageInstructionField: "title",
          imageDescriptionField: "alt",
        },
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          type: "string",
          description:
            "Required — describe the image for screen readers and SEO. 3-125 characters.",
          validation: (Rule) => Rule.required().min(3).max(125),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "blockContent",
      validation: (Rule) =>
        Rule.required().min(1).warning("Articles need content."),
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (Rule) =>
        Rule.required()
          .min(1)
          .max(3)
          .warning("Pick 1-3 categories — one primary, up to two related."),
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "reference", to: [{ type: "tag" }] }],
      validation: (Rule) => Rule.max(10).warning("More than 10 tags hurts SEO."),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "isPremium",
      title: "Premium Content",
      type: "boolean",
      description: "Locks the article behind a Pro subscription.",
      initialValue: false,
    }),
    defineField({
      name: "seoTitle",
      title: "SEO Title",
      type: "string",
      description:
        "50-60 characters. Appears in Google search results — different from the article H1.",
      options: { aiAssist: { translateAction: false } },
      components: { input: SeoTitleCounter.StringVariant },
      validation: (Rule) =>
        Rule.max(70).warning("Google truncates SEO titles past ~60 characters."),
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Description",
      type: "text",
      rows: 2,
      description:
        "150-160 characters. Appears under the title in search results; should include the primary keyword naturally.",
      options: { aiAssist: { translateAction: false } },
      components: { input: SeoDescriptionCounter.TextVariant },
      validation: (Rule) =>
        Rule.max(170).warning("Google truncates meta descriptions past ~160 characters."),
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      description: "Sortable publication date. Set when you publish.",
    }),
    defineField({
      name: "readingTime",
      title: "Reading Time (minutes)",
      type: "number",
      description:
        "Optional manual override. Leave empty to compute automatically from content.",
      validation: (Rule) =>
        Rule.min(1).max(120).integer().warning("Override should be 1-120 minutes."),
    }),
  ],
  preview: {
    select: {
      title: "title",
      author: "author.name",
      media: "featuredImage",
      status: "status",
    },
    prepare({ title, author, media, status }) {
      const subtitleParts = [author && `by ${author}`, status && `· ${status}`].filter(
        Boolean,
      );
      return {
        title,
        subtitle: subtitleParts.join(" "),
        media,
      };
    },
  },
});
