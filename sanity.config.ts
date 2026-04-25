import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { visionTool } from "@sanity/vision";
import { assist } from "@sanity/assist";
import { schemas } from "./sanity/schemas";
import SeoScoreBadge from "./sanity/badges/SeoScoreBadge";
import ReadingTimeBadge from "./sanity/badges/ReadingTimeBadge";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ||
  "http://localhost:3000";

export default defineConfig({
  name: "blog-cms",
  title: "CodeFromScratch CMS",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [
    structureTool(),
    presentationTool({
      previewUrl: {
        origin: siteUrl,
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    assist(),
    visionTool(),
  ],
  schema: { types: schemas },
  document: {
    badges: (prev, context) =>
      context.schemaType === "post"
        ? [...prev, SeoScoreBadge, ReadingTimeBadge]
        : prev,
  },
  basePath: "/portal-cfs-admin/studio",
});
