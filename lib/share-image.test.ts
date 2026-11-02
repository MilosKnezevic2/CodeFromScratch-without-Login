import { beforeEach, describe, expect, it, vi } from "vitest";
import { articleCount, shareImageUrl } from "./share-image";

describe("shareImageUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://codefromscratch.org");
  });

  it("builds the /api/og address with each part encoded", () => {
    expect(shareImageUrl("Zod & trust", "APIs & Integrations", "Category · 3 articles")).toBe(
      "https://codefromscratch.org/api/og?title=Zod%20%26%20trust&category=APIs%20%26%20Integrations&kicker=Category%20%C2%B7%203%20articles",
    );
  });

  it("leaves out what is not given", () => {
    expect(shareImageUrl("Hello")).toBe("https://codefromscratch.org/api/og?title=Hello");
    expect(shareImageUrl("Hello", undefined, "Tag")).toBe("https://codefromscratch.org/api/og?title=Hello&kicker=Tag");
  });
});

describe("articleCount", () => {
  it("counts in English", () => {
    expect(articleCount(1)).toBe("1 article");
    expect(articleCount(7)).toBe("7 articles");
  });
});
