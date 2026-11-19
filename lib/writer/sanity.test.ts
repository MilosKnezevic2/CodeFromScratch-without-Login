import { describe, expect, it } from "vitest";
import { approvalDocuments, sanityPostId, sniffImage, studioUrl } from "./sanity";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

describe("sniffImage", () => {
  it("recognises PNG, JPEG, WebP and GIF by their bytes", () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.mime).toBe("image/png");
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))?.mime).toBe("image/webp");
    expect(sniffImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))?.mime).toBe("image/gif");
  });

  it("refuses SVG, HTML and anything else, whatever the file name says", () => {
    const text = (s: string) => new TextEncoder().encode(s);
    expect(sniffImage(text('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'))).toBeNull();
    expect(sniffImage(text("<!doctype html><p>hi</p>"))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe("approvalDocuments", () => {
  const draft = { id: "d1", title: "When Search Results Arrive Out of Order", excerpt: "Why older answers win.", body: [] };

  it("makes an unpublished post that points to the author's profile", () => {
    const { author, post } = approvalDocuments(draft, { id: "u1", name: "Olivia Bennett" });
    expect(author).toEqual({ _id: "author-writer-u1", _type: "author", name: "Olivia Bennett", slug: { _type: "slug", current: "olivia-bennett" } });
    expect(post._id).toBe("drafts.writer-d1");
    expect(post).toMatchObject({
      _type: "post",
      title: draft.title,
      slug: { current: "when-search-results-arrive-out-of-order" },
      excerpt: draft.excerpt,
      content: [],
      author: { _type: "reference", _ref: "author-writer-u1" },
      status: "draft",
    });
  });

  it("never names a published id for the post", () => {
    expect(approvalDocuments(draft, { id: "u1", name: null }).post._id.startsWith("drafts.")).toBe(true);
    expect(approvalDocuments(draft, { id: "u1", name: "  " }).author.name).toBe("Guest author");
  });

  it("links the Studio to the same document", () => {
    expect(sanityPostId("d1")).toBe("writer-d1");
    expect(studioUrl("d1")).toBe("/portal-cfs-admin/studio/intent/edit/id=writer-d1;type=post");
  });
});
