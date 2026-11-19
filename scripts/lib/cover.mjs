/**
 * The branded cover every article gets: the site's OG image for the title and
 * category, uploaded to Sanity. Shared by publish-post.mjs and
 * import-guest-post.mts so every article has the same cover.
 */
const OG_BASE = "https://codefromscratch-ten.vercel.app/api/og";

export async function uploadCover(client, slug, title, categoryName) {
  const url = `${OG_BASE}?title=${encodeURIComponent(title)}&category=${encodeURIComponent(categoryName)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OG fetch ${res.status} for "${title}"`);
  const buf = Buffer.from(await res.arrayBuffer());
  const asset = await client.assets.upload("image", buf, {
    filename: `cover-${slug}.png`,
    contentType: "image/png",
  });
  return asset._id;
}
