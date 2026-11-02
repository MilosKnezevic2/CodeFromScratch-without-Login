import { describe, expect, it } from "vitest";
import { COMMENT_MAX, displayName, initialStatus, isPostSlug, linkCount, parseCommentBody } from "./comments";

describe("parseCommentBody", () => {
  it("trims, unifies line endings and folds blank lines", () => {
    expect(parseCommentBody("  Great post!\r\n\r\n\r\n\r\nThanks  ")).toEqual({ ok: true, body: "Great post!\n\nThanks" });
  });

  it("removes control and direction-override characters", () => {
    expect(parseCommentBody("ab\u0000c‮d​e")).toEqual({ ok: true, body: "abcde" });
  });

  it("refuses empty, too short, too long and non-text", () => {
    expect(parseCommentBody("   ").ok).toBe(false);
    expect(parseCommentBody("a").ok).toBe(false);
    expect(parseCommentBody("x".repeat(COMMENT_MAX + 1)).ok).toBe(false);
    expect(parseCommentBody(42).ok).toBe(false);
  });

  it("keeps markup as plain characters", () => {
    expect(parseCommentBody("<script>alert(1)</script>")).toEqual({ ok: true, body: "<script>alert(1)</script>" });
  });
});

describe("initialStatus", () => {
  it("holds a reader's first comment", () => {
    expect(initialStatus(false, "hello there")).toBe("PENDING");
  });

  it("publishes once a reader has an approved comment, unless it is link-heavy", () => {
    expect(initialStatus(true, "hello there")).toBe("APPROVED");
    expect(initialStatus(true, "see https://a.example https://b.example www.c.example")).toBe("PENDING");
    expect(linkCount("https://a.example and www.b.example")).toBe(2);
  });
});

describe("helpers", () => {
  it("accepts only article slugs", () => {
    expect(isPostSlug("zod-at-trust-boundaries")).toBe(true);
    expect(isPostSlug("../etc")).toBe(false);
    expect(isPostSlug("")).toBe(false);
  });

  it("never shows an empty name", () => {
    expect(displayName("  ")).toBe("Reader");
    expect(displayName(null)).toBe("Reader");
    expect(displayName("Emily Carter")).toBe("Emily Carter");
  });
});
