import { describe, expect, it } from "vitest";
import type { ResolvedMetadata, ResolvingMetadata } from "next";
import { withPageUrl } from "./seo";

const parentWith = (openGraph: unknown): ResolvingMetadata =>
  Promise.resolve({ openGraph } as ResolvedMetadata);

describe("withPageUrl", () => {
  it("sets og:url and the canonical to the same address", async () => {
    const meta = await withPageUrl("/newsletter", { title: "Letter" }, parentWith(null));
    expect(meta.openGraph?.url).toBe("https://codefromscratch.org/newsletter");
    expect(meta.alternates?.canonical).toBe("https://codefromscratch.org/newsletter");
    expect(meta.title).toBe("Letter");
  });

  it("keeps the layout's share image, site name and locale", async () => {
    const images = [{ url: "https://codefromscratch.org/brand/og-default.png", width: 1200, height: 630 }];
    const meta = await withPageUrl(
      "",
      {},
      parentWith({ siteName: "CodeFromScratch", locale: "en_US", images }),
    );
    expect(meta.openGraph).toMatchObject({
      url: "https://codefromscratch.org",
      siteName: "CodeFromScratch",
      locale: "en_US",
      images,
    });
  });

  it("keeps other alternates the page declares", async () => {
    const meta = await withPageUrl(
      "/terms",
      { alternates: { types: { "application/rss+xml": "/blog/rss.xml" } } },
      parentWith(null),
    );
    expect(meta.alternates?.types).toEqual({ "application/rss+xml": "/blog/rss.xml" });
  });
});
