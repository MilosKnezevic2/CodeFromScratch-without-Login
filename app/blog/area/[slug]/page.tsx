import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackToTop from "@/components/blog/BackToTop";
import { FrontCard } from "@/components/blog/front/FrontCards";
import { JournalMasthead } from "@/components/blog/front/BlogFront";
import JsonLd from "@/components/seo/JsonLd";
import { AREAS, areaBySlug, areaOfCategory, isIndexableList } from "@/lib/blog/front";
import { buildSafe } from "@/lib/sanity/build-safe";
import { getFrontPosts } from "@/lib/sanity/queries";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo";
import { articleCount, shareImageUrl } from "@/lib/share-image";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

type PageProps = { params: Promise<{ slug: string }> };

// Prerendered and refreshed every minute, like the journal front.
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return AREAS.map((a) => ({ slug: a.slug }));
}

async function areaPosts(slug: string) {
  const area = areaBySlug(slug);
  if (!area) return null;
  const posts = (await buildSafe(getFrontPosts(), [])).filter((p) => areaOfCategory(p.category?.slug) === area);
  return { area, posts };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const found = await areaPosts((await params).slug);
  if (!found) return { title: "Not found" };
  const { area, posts } = found;
  const canonical = `${SITE_URL}/blog/area/${area.slug}`;
  const ogImage = shareImageUrl(area.name, area.name, `Area · ${articleCount(posts.length)}`);
  return {
    title: area.searchTitle ?? `${area.name} tutorials`,
    description: `${posts.length} in-depth ${area.name.toLowerCase()} tutorials: ${area.why.toLowerCase()}.`,
    alternates: { canonical },
    openGraph: { url: canonical, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [ogImage] },
    // A one- or two-article area is a thin page: follow its links, do not index it.
    ...(!isIndexableList(posts.length) && { robots: { index: false, follow: true } }),
  };
}

export default async function AreaPage({ params }: PageProps) {
  const found = await areaPosts((await params).slug);
  if (!found) notFound();
  const { area, posts } = found;
  const url = `${SITE_URL}/blog/area/${area.slug}`;

  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Journal", url: `${SITE_URL}/blog` },
          { name: area.name, url },
        ])}
      />
      {posts.length > 0 && <JsonLd data={itemListJsonLd(posts.map((p) => ({ name: p.title, url: `${SITE_URL}/blog/${p.slug}` })))} />}
      <BackToTop />
      <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted-foreground">
          <Link href="/blog" className="hover:text-foreground">
            Journal
          </Link>{" "}
          / <span className="text-foreground">{area.name}</span>
        </nav>
        <JournalMasthead activeArea={area} heading={area.name} intro={`${area.why}. ${articleCount(posts.length)}, newest first.`} />
        {posts.length === 0 ? (
          <p className="mt-12 text-muted">
            Nothing here yet.{" "}
            <Link href="/blog" className="text-accent underline underline-offset-2">
              Back to the journal
            </Link>
            .
          </p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {posts.map((p) => (
              <FrontCard key={p._id} post={p} showExcerpt />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
