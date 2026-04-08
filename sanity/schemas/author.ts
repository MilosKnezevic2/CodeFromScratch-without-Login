import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text",
    }),
    defineField({
      name: "twitter",
      title: "Twitter / X",
      type: "string",
      description: "Username without @ (e.g. milosknezevic)",
    }),
    defineField({
      name: "github",
      title: "GitHub",
      type: "string",
      description: "Username (e.g. MilosKnezevic2)",
    }),
    defineField({
      name: "website",
      title: "Website",
      type: "url",
    }),
    defineField({
      name: "linkedin",
      title: "LinkedIn",
      type: "string",
      description: "Username or profile path",
    }),
  ],
});
