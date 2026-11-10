import { describe, expect, it } from "vitest";
import { buildThreads, COMMENT_MAX, flattenThread, threadRoots, displayName, initialStatus, isPostSlug, linkCount, parseCommentBody } from "./comments";

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

describe("buildThreads", () => {
  const c = (id: string, parentId: string | null, t: string) => ({
    id,
    parentId,
    body: id,
    createdAt: `2026-11-03T10:${t}:00Z`,
    author: { name: "Emily", image: null },
    mine: false,
    pending: false,
  });

  it("nests replies under their parent, to any depth", () => {
    const threads = buildThreads([c("a", null, "00"), c("b", "a", "01"), c("c", "b", "02"), c("d", "c", "03"), c("e", null, "04")]);
    expect(threads.map((n) => n.id)).toEqual(["a", "e"]);
    const d = threads[0].replies[0].replies[0].replies[0];
    expect(d.id).toBe("d");
    expect(d.depth).toBe(3);
  });

  it("keeps a reply whose parent is gone under a removed stand-in", () => {
    const threads = buildThreads([c("b", "gone", "01"), c("c", "gone", "02")]);
    expect(threads).toHaveLength(1);
    expect(threads[0].removed).toBe(true);
    expect(threads[0].replies.map((n) => n.id)).toEqual(["b", "c"]);
    expect(threads[0].replies[0].depth).toBe(1);
  });

  it("flattens a deep conversation into one level, oldest first, naming whom each reply answers", () => {
    const named = (id: string, parentId: string | null, t: string, name: string) => ({ ...c(id, parentId, t), author: { name, image: null } });
    const [root] = buildThreads([
      named("a", null, "00", "Ana"),
      named("b", "a", "01", "Ben"),
      named("c", "b", "03", "Ana"),
      named("d", "a", "02", "Cleo"),
      named("e", "c", "04", "Ben"),
    ]);
    expect(flattenThread(root).map((r) => [r.node.id, r.replyingTo])).toEqual([
      ["b", null],
      ["d", null],
      ["c", "Ben"],
      ["e", "Ana"],
    ]);
    expect(threadRoots([root]).get("e")).toBe("a");
  });
});
