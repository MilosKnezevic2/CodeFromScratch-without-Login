import { describe, expect, it } from "vitest";
import { imageInfo } from "./image";

describe("imageInfo", () => {
  it("reads the size and format from the reference", () => {
    expect(imageInfo({ asset: { _ref: "image-0a1b2c3d4e5f-1600x900-png" } })).toEqual({
      width: 1600,
      height: 900,
      format: "png",
    });
    expect(imageInfo({ asset: { _ref: "image-abc-320x240-svg" } })?.format).toBe("svg");
  });

  it("answers null for a reference without a size", () => {
    expect(imageInfo({ asset: { _ref: "image-abc" } })).toBeNull();
    expect(imageInfo({ asset: { _ref: "" } })).toBeNull();
  });
});
