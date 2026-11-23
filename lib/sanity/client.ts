import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  // The API, not the CDN: pages are rebuilt rarely (once a day, or when
  // /api/revalidate is called on publish), and the CDN can still serve the
  // version from before a publish for a while, so a rebuild right after
  // publishing would cache the old content for a day.
  useCdn: false,
});

export const previewClient = createClient({
  projectId,
  dataset,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
