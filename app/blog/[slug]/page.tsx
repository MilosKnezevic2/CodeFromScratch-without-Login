import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs, getAdjacentPosts, getSidebarSuggestions } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import { extractHeadings } from "@/lib/portable-text-utils";
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
import ViewCounter from "@/components/blog/ViewCounter";
import FontSizeToggle from "@/components/blog/FontSizeToggle";
import Comments from "@/components/blog/Comments";
import ReadingTracker from "@/components/blog/ReadingTracker";
import TextSelectionShare from "@/components/blog/TextSelectionShare";
import KeyboardNav from "@/components/blog/KeyboardNav";
import SavePostButton from "@/components/blog/SavePostButton";
import MobileTocDrawer from "@/components/blog/MobileTocDrawer";

import PremiumGate from "@/components/blog/PremiumGate";
import { getCurrentUser } from "@/lib/auth-helpers";
import NewsletterCTA from "@/components/newsletter/NewsletterCTA";
import FadeUp from "@/components/animations/FadeUp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((s) => ({ slug: s.slug.current }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: "Post not found" };

  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}${
    post.categories?.[0] ? `&category=${encodeURIComponent(post.categories[0].title)}` : ""
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

  const [{ prev, next }, currentUser, suggestionGroups] = await Promise.all([
    getAdjacentPosts(post.publishedAt),
    getCurrentUser(),
    getSidebarSuggestions(post._id, categorySlugs, tagSlugs, categoryTitle),
  ]);

  // Premium content gating
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

      <ArticleJsonLd
        title={post.title}
        slug={slug}
        excerpt={post.excerpt}
        publishedAt={post.publishedAt}
        authorName={post.author?.name}
        imageUrl={featuredImageUrl}
      />

      {/* ══ MAIN LAYOUT ══ */}
      <div className="article-ambient mx-auto max-w-[1600px] px-0 pb-24 sm:px-6 sm:pt-8 lg:px-8">
        {/* Mobile TOC + Suggested — sticky bar */}
        <div className="sticky top-[64px] z-30 mb-4 flex gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none 2xl:hidden">
          <MobileTocDrawer headings={headings} />
          <div className="ml-auto flex items-center">
            <SavePostButton postSlug={slug} />
          </div>
        </div>

        <div className="relative flex justify-center gap-8 2xl:gap-20">
          {/* ── Left sidebar — TOC (desktop) ── */}
          <aside className="hidden w-48 shrink-0 2xl:block 2xl:pr-8">
            <div className="sticky top-24">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">On this page</p>
              <TableOfContents headings={headings} />
              <div className="mt-8 space-y-3 border-t border-border/30 pt-5">
                <FontSizeToggle />
                <p className="text-[11px] text-muted-foreground">
                  <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px]">j</kbd> / <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px]">k</kbd> navigate headings
                </p>
              </div>
            </div>
          </aside>

          {/* ── Center — Article ── */}
          <article className="min-w-0 max-w-[1000px] flex-1">
            {/* Breadcrumbs */}
            <div className="px-4 sm:px-0">
              <Breadcrumbs category={post.categories?.[0]} postTitle={post.title} />
            </div>

            {/* ── Featured Image + Author overlay ── */}
            {post.featuredImage?.asset && (
              <div className="relative mx-auto w-full">
                <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-r from-accent/10 via-accent-2/5 to-accent/10 blur-2xl" />
                <div className="glow-border relative overflow-hidden rounded-2xl">
                  <div className="relative aspect-[2/1] w-full">
                    <Image
                      src={urlFor(post.featuredImage).width(1400).quality(85).url()}
                      alt={post.featuredImage.alt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 840px"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>
                  {/* Author bar inside image card */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 py-4 sm:px-6">
                    {post.author && (
                      <>
                        {post.author.image?.asset ? (
                          <Image
                            src={urlFor(post.author.image).width(64).height(64).url()}
                            alt={post.author.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover ring-2 ring-white/20"
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                            {post.author.name.charAt(0)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-white/90">{post.author.name}</span>
                      </>
                    )}
                    <span className="text-[11px] text-white/50">
                      {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      {post.readingTime && <> · {post.readingTime} min read</>}
                    </span>
                    <div className="ml-auto">
                      <ViewCounter slug={slug} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Header — centered ── */}
            <header className="relative px-4 pb-12 pt-8 text-center sm:px-0 sm:pt-10">
              {/* Category */}
              <FadeUp>
                <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
                  {post.categories?.map((cat) => (
                    <Link
                      key={cat.slug.current}
                      href={`/blog/category/${cat.slug.current}`}
                      className="text-[13px] font-semibold uppercase tracking-[0.1em] text-accent transition hover:text-accent-2"
                    >
                      {cat.title}
                    </Link>
                  ))}
                  {post.isPremium && (
                    <span className="badge-glow rounded px-2 py-0.5 text-[10px] font-extrabold uppercase">PRO</span>
                  )}
                </div>
              </FadeUp>

              {/* Title — large, centered */}
              <FadeUp delay={0.05}>
                <h1 className="mx-auto max-w-[900px] text-[1.75rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[2.5rem] lg:text-[3rem]" style={{ fontFamily: "var(--font-heading)" }}>
                  {post.title}
                </h1>
              </FadeUp>

              {/* Accent line */}
              <FadeUp delay={0.08}>
                <div className="mx-auto mt-6 h-[2px] w-16 rounded-full bg-gradient-to-r from-accent to-accent-2 shadow-[0_0_10px_rgba(45,212,191,0.4)]" />
              </FadeUp>

              {/* Excerpt */}
              <FadeUp delay={0.1}>
                {post.excerpt && (
                  <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.7] text-muted">{post.excerpt}</p>
                )}
              </FadeUp>
            </header>

            {/* ── Article content ── */}
            <div id="article-content" className="prose-dark prose-immersive drop-cap-first px-4 sm:px-0">
              {showGate ? (
                <>
                  {post.content && (
                    <div className="relative max-h-[600px] overflow-hidden">
                      <PortableTextRenderer content={post.content.slice(0, 3)} />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
                    </div>
                  )}
                  <PremiumGate />
                </>
              ) : (
                post.content && <PortableTextRenderer content={post.content} />
              )}
            </div>

            {/* ── Footer section ── */}
            <div className="px-4 sm:px-0">
              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tags</span>
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.slug.current}
                      href={`/blog/tag/${tag.slug.current}`}
                      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition hover:border-accent/30 hover:bg-accent/5 hover:text-accent"
                    >
                      {tag.title}
                    </Link>
                  ))}
                </div>
              )}

              {/* Reactions — elevated card */}
              <div className="glass-card mt-10 overflow-hidden p-8">
                <PostReactions slug={slug} />
              </div>

              {/* Share & Save */}
              <div className="mt-6 flex items-center gap-3">
                <ShareButtons title={post.title} slug={slug} />
                <SavePostButton postSlug={slug} />
              </div>

              {/* Author card — elevated */}
              {post.author && (
                <div className="mt-10">
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

              {/* Comments */}
              <Comments />

              {/* Prev/Next navigation */}
              <PostNavigation prev={prev} next={next} />
            </div>
          </article>

          {/* ── Right sidebar — Suggested Posts (desktop) ── */}
          <aside className="hidden w-48 shrink-0 2xl:block 2xl:pl-8">
            <div className="sticky top-24">
              <SmartSuggestions groups={suggestionGroups} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
