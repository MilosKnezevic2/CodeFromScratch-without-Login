import { createImageUrlBuilder } from "@sanity/image-url";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

// Built from the plain config, not from the API client: browser components
// import this too, and the client would drag the whole Sanity SDK (about
// 100 KiB) into every article page.
const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: { asset: { _ref: string } }) {
  return builder.image(source);
}
