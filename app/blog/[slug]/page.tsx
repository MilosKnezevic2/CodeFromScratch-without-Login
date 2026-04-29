import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getPostBySlug,
  getAllPostSlugs,
  getAdjacentPosts,
  getSidebarSuggestions,
} from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import { extractHeadings } from "@/lib/portable-text-utils";
import { calculateReadingTime } from "@/lib/reading-time";
import TableOfContents from "@/components/blog/TableOfContents";
import SmartSuggestions from "@/components/blog/SmartSuggestions";
import ReadingProgress from "@/components/blog/ReadingProgress";
import ShareButtons from "@/components/blog/ShareButtons";
import BackToTop from "@/components/blog/BackToTop";
import PostNavigation from "@/components/blog/PostNavigation";
import AuthorCard from "@/components/blog/AuthorCard";
import PostReactions from "@/components/blog/PostReactions";
import Breadcrumbs from "@/components/blog/Breadcrumbs";
import ArticleJsonLd from "@/components/blog/ArticleJsonLd";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import FontSizeToggle from "@/components/blog/FontSizeToggle";
import ReadingTracker from "@/components/blog/ReadingTracker";
import TextSelectionShare from "@/components/blog/TextSelectionShare";
import KeyboardNav from "@/components/blog/KeyboardNav";
import SavePostButton from "@/components/blog/SavePostButton";
import MobileTocDrawer from "@/components/blog/MobileTocDrawer";
import BlogPostMasthead from "@/components/blog/BlogPostMasthead";
import PostFeaturedImage from "@/components/blog/PostFeaturedImage";
import PostSignoff from "@/components/blog/PostSignoff";
import FloatingActionRail from "@/components/blog/FloatingActionRail";
import CommentsCollapse from "@/components/blog/CommentsCollapse";

import PremiumGate from "@/components/blog/PremiumGate";
import { getCurrentUser } from "@/lib/auth-helpers";
import NewsletterCTA from "@/components/newsletter/NewsletterCTA";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((s) => ({ slug: s.slug.current }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Post not found" };

  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}${
    post.categories?.[0]
      ? `&category=${encodeURIComponent(post.categories[0].title)}`
      : ""
  }`;

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: [ogImage],
    },
    alternates: {
      types: {
        "application/rss+xml": "/blog/rss.xml",
      },
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const headings = post.content ? extractHeadings(post.content) : [];
  const categorySlugs = post.categories?.map((c) => c.slug.current) || [];
  const tagSlugs = post.tags?.map((t) => t.slug.current) || [];
  const categoryTitle = post.categories?.[0]?.title || "Related";
  const readingMinutes =
    typeof post.readingTime === "number" && post.readingTime > 0
      ? post.readingTime
      : calculateReadingTime(post.content ?? null);

  const [{ prev, next }, currentUser, suggestionGroups] = await Promise.all([
    getAdjacentPosts(post.publishedAt),
    getCurrentUser(),
    getSidebarSuggestions(post._id, categorySlugs, tagSlugs, categoryTitle),
  ]);

  const isPremiumPost = post.isPremium;
  const userPlan = (currentUser as unknown as { plan?: string })?.plan || "FREE";
  const canAccessPremium = userPlan === "PRO" || userPlan === "PRO_PLUS";
  const showGate = isPremiumPost && !canAccessPremium;

  const featuredImageUrl = post.featuredImage?.asset
    ? urlFor(post.featuredImage).width(1200).url()
    : undefined;

  return (
    <>
      <ReadingProgress />
      <ReadingTracker slug={slug} />
      <BackToTop />
      <TextSelectionShare slug={slug} />
      <KeyboardNav headings={headings} />
      <FloatingActionRail slug={slug} title={post.title} />

      <ArticleJsonLd
        title={post.title}
        slug={slug}
        excerpt={post.excerpt}
        publishedAt={post.publishedAt}
        authorName={post.author?.name}
        imageUrl={featuredImageUrl}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: "Blog", url: `${SITE_URL}/blog` },
          ...(post.categories?.[0]
            ? [
                {
                  name: post.categories[0].title,
                  url: `${SITE_URL}/blog?category=${post.categories[0].slug.current}`,
                },
              ]
            : []),
          { name: post.title, url: `${SITE_URL}/blog/${slug}` },
        ])}
      />

      {/* Mobile sticky bar — TOC + Save + reading time */}
      <div className="sticky top-[64px] z-30 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md 2xl:hidden">
        <MobileTocDrawer headings={headings} />
        <span className="editorial-meta text-muted-foreground">
          {readingMinutes} min read
        </span>
        <div className="ml-auto">
          <SavePostButton postSlug={slug} iconOnly />
        </div>
      </div>

      <main className="mx-auto max-w-[1600px] px-4 pb-32 sm:px-6 lg:px-8">
        {/* Top breadcrumbs (desktop) */}
        <div className="hidden pt-8 sm:block">
          <Breadcrumbs
            category={post.categories?.[0]}
            postTitle={post.title}
          />
        </div>

        <div className="relative flex justify-center gap-12 2xl:gap-20">
          {/* ── Left sidebar — TOC ── */}
          <aside className="hidden w-52 shrink-0 2xl:block">
            <div className="sticky top-24">
              <p className="editorial-meta mb-3 text-foreground">
                On this page
              </p>
              <TableOfContents headings={headings} />
              <div className="mt-8 space-y-3 border-t border-border/30 pt-5">
                <FontSizeToggle />
                <p className="editorial-meta">
                  <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px] font-mono">
                    j
                  </kbd>{" "}
                  /{" "}
                  <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px] font-mono">
                    k
                  </kbd>{" "}
                  navigate headings
                </p>
              </div>
            </div>
          </aside>

          {/* ── Center column — article ── */}
          <article className="min-w-0 max-w-[860px] flex-1">
            <BlogPostMasthead
              title={post.title}
              excerpt={post.excerpt}
              categories={post.categories}
              author={post.author}
              publishedAt={post.publishedAt}
              readingMinutes={readingMinutes}
              isPremium={post.isPremium}
              slug={slug}
            />

            {post.featuredImage?.asset && (
              <PostFeaturedImage
                image={post.featuredImage}
                fallbackAlt={post.title}
              />
            )}

            {/* ── Article body ── */}
            <div
              id="article-content"
              className="prose-editorial mt-12"
            >
              {showGate ? (
                <>
                  {post.content && (
                    <div className="relative max-h-[600px] overflow-hidden">
                      <PortableTextRenderer
                        content={post.content.slice(0, 3)}
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
                    </div>
                  )}
                  <PremiumGate />
                </>
              ) : (
                post.content && <PortableTextRenderer content={post.content} />
              )}
            </div>

            {/* ── End-of-read footer ── */}
            <footer className="mt-16">
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2 border-t border-border pt-8">
                  <span className="editorial-meta">Tagged</span>
                  {post.tags.map((tag, i) => (
                    <span key={tag.slug.current} className="text-sm">
                      <Link
                        href={`/blog/tag/${tag.slug.current}`}
                        className="text-foreground transition-colors hover:text-accent"
                      >
                        {tag.title}
                      </Link>
                      {i < (post.tags?.length ?? 0) - 1 && (
                        <span
                          aria-hidden
                          className="ml-3 text-muted-foreground"
                        >
                          ·
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Author sign-off */}
              {post.author && (
                <div className="mt-8">
                  <PostSignoff
                    author={post.author}
                    publishedAt={post.publishedAt}
                    location="Graz"
                  />
                </div>
              )}

              {/* Reactions + share row */}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
                <PostReactions slug={slug} />
                <div className="flex items-center gap-2">
                  <ShareButtons title={post.title} slug={slug} />
                  <SavePostButton postSlug={slug} />
                </div>
              </div>

              {/* Author bio card */}
              {post.author && (
                <div className="mt-12">
                  <AuthorCard
                    name={post.author.name}
                    bio={post.author.bio}
                    image={post.author.image}
                    twitter={post.author.twitter}
                    github={post.author.github}
                    website={post.author.website}
                    linkedin={post.author.linkedin}
                  />
                </div>
              )}

              {/* Newsletter CTA */}
              <div className="mt-12">
                <NewsletterCTA />
              </div>

              {/* Comments — collapsed by default */}
              <CommentsCollapse />

              {/* Prev/next */}
              <PostNavigation prev={prev} next={next} />
            </footer>
          </article>

          {/* ── Right sidebar — Suggested Posts ── */}
          <aside className="hidden w-52 shrink-0 2xl:block">
            <div className="sticky top-24">
              <SmartSuggestions groups={suggestionGroups} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
