import { describe, expect, it } from "vitest";
import { safeCallbackPath } from "./auth-callback";

describe("safeCallbackPath", () => {
  it("keeps a path on this site", () => {
    expect(safeCallbackPath("/blog/zod-at-trust-boundaries#comments")).toBe("/blog/zod-at-trust-boundaries#comments");
  });

  it("refuses other origins and tricks", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "evil"]) {
      expect(safeCallbackPath(bad)).toBe("/");
    }
  });

  it("falls back to home", () => {
    expect(safeCallbackPath(undefined)).toBe("/");
    expect(safeCallbackPath("/login?x=1")).toBe("/");
  });
});
