import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { avatarPath, isUploadedAvatar, processAvatar } from "./avatar";

describe("processAvatar", () => {
  it("turns a wide photo into a 256 px square WebP without its camera data", async () => {
    const photo = await sharp({ create: { width: 1600, height: 900, channels: 3, background: "#2dd4bf" } })
      .jpeg()
      .withExif({ IFD0: { Artist: "secret" } })
      .toBuffer();
    expect((await sharp(photo).metadata()).exif).toBeDefined();

    const result = await processAvatar(photo);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = await sharp(result.data).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 256, height: 256 });
    expect(meta.exif).toBeUndefined();
  });

  it("refuses files that are not pictures, whatever they are called", async () => {
    const result = await processAvatar(Buffer.from("<svg onload=alert(1)>not really</svg>"));
    expect(result).toEqual({ ok: false, error: "That file could not be read as a picture. Try a JPG or PNG." });
    expect((await processAvatar(Buffer.alloc(0))).ok).toBe(false);
  });

  it("refuses an upload over the limit before decoding it", async () => {
    expect(await processAvatar(Buffer.alloc(4 * 1024 * 1024 + 1))).toEqual({ ok: false, error: "Use a picture under 4 MB." });
  });
});

describe("avatar addresses", () => {
  it("version the picture so a new one is never served from an old cache", () => {
    const a = avatarPath("u1", new Date(1_700_000_000_000));
    expect(a).toMatch(/^\/api\/avatar\/u1\?v=[0-9a-z]+$/);
    expect(avatarPath("u1", new Date(1_700_000_000_001))).not.toBe(a);
    expect(isUploadedAvatar(a)).toBe(true);
    expect(isUploadedAvatar("https://avatars.githubusercontent.com/u/1")).toBe(false);
    expect(isUploadedAvatar(null)).toBe(false);
  });
});
