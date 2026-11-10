import sharp from "sharp";

/**
 * The largest upload accepted. Vercel refuses request bodies over 4.5 MB, so
 * the browser shrinks a phone photo before sending it; this is the limit
 * for what still arrives unshrunk (a HEIC file the browser cannot decode).
 */
export const AVATAR_MAX_BYTES = 4 * 1024 * 1024;
export const AVATAR_SIZE = 256;
const MAX_INPUT_PIXELS = 50_000_000;
const FORMATS = new Set(["jpeg", "png", "webp", "gif", "avif", "heif"]);

export type AvatarResult = { ok: true; data: Buffer } | { ok: false; error: string };

/**
 * Turns an upload into the stored picture: decoded by sharp (so the file
 * must really be an image, whatever its name says), turned upright, cropped
 * to a square, 256 px, WebP. Re-encoding drops EXIF data such as GPS
 * position and anything hidden in the original file.
 */
export async function processAvatar(input: Buffer): Promise<AvatarResult> {
  if (input.length === 0) return { ok: false, error: "That file is empty." };
  if (input.length > AVATAR_MAX_BYTES) return { ok: false, error: "Use a picture under 4 MB." };
  try {
    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, animated: false });
    const meta = await image.metadata();
    if (!meta.format || !FORMATS.has(meta.format)) return { ok: false, error: "Use a JPG, PNG, WebP, GIF, AVIF or HEIC picture." };
    const data = await image
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
    return { ok: true, data };
  } catch {
    // sharp throws on anything it cannot decode: not an image, truncated, or too large.
    return { ok: false, error: "That file could not be read as a picture. Try a JPG or PNG." };
  }
}

/** The address User.image holds for an uploaded picture; the version busts browser caches after a change. */
export function avatarPath(userId: string, version: Date): string {
  return `/api/avatar/${userId}?v=${version.getTime().toString(36)}`;
}

export function isUploadedAvatar(image: string | null | undefined): boolean {
  return Boolean(image?.startsWith("/api/avatar/"));
}
