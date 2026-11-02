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

/**
 * The pixel size and format a Sanity image reference carries in its name
 * ("image-<id>-1600x900-png"), so a body image can declare real dimensions
 * without another query. Null when the reference has no such suffix.
 */
export function imageInfo(source: { asset: { _ref: string } }): { width: number; height: number; format: string } | null {
  const m = /-(\d+)x(\d+)-(\w+)$/.exec(source.asset._ref);
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]), format: m[3] };
}
