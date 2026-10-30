import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://codefromscratch.org";
/** Public by design: IndexNow proves ownership by serving the key at /<key>.txt. */
const INDEXNOW_KEY = "dd671c2ccc673598cd70b9f8b2a9ff2c";

/**
 * Tells Bing and the other IndexNow engines about a changed page the moment
 * Sanity publishes it. Google ignores IndexNow and reads the sitemap instead.
 * A failure is logged and never blocks the revalidation.
 */
async function pingIndexNow(urls: string[]): Promise<void> {
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(SITE_URL).host, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.error(`IndexNow answered ${res.status}`);
  } catch (error) {
    console.error("IndexNow ping failed:", error);
  }
}

function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Called by the Sanity webhook when content is published. Requires the
 * shared secret from SANITY_REVALIDATE_SECRET — without a check, anyone
 * could purge the blog cache in a loop and force constant re-renders
 * (which also re-hit Sanity and Postgres). Configure the same value as a
 * custom `x-revalidate-secret` header in the Sanity webhook settings.
 */
export async function POST(request: Request) {
  const expected = process.env.SANITY_REVALIDATE_SECRET;
  if (!expected) {
    // Fail closed: an unset secret must not leave the endpoint open.
    return NextResponse.json(
      { revalidated: false, error: "Revalidation is not configured" },
      { status: 503 },
    );
  }

  const provided =
    request.headers.get("x-revalidate-secret") ??
    new URL(request.url).searchParams.get("secret") ??
    "";
  if (!provided || !secretsMatch(provided, expected)) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { _type, slug } = body;

    // Revalidate based on content type
    if (_type === "post") {
      revalidatePath("/blog");
      revalidatePath("/blog/category/[slug]", "page");
      revalidatePath("/blog/tag/[slug]", "page");
      if (slug?.current) {
        revalidatePath(`/blog/${slug.current}`);
        await pingIndexNow([`${SITE_URL}/blog/${slug.current}`, `${SITE_URL}/blog`]);
      }
    }

    if (_type === "ebook") {
      revalidatePath("/ebooks");
      if (slug?.current) {
        revalidatePath(`/ebooks/${slug.current}`);
      }
    }

    if (_type === "category") {
      revalidatePath("/blog");
      revalidatePath("/blog/category/[slug]", "page");
    }

    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 500 });
  }
}
