import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getPostBySlug, getAllPostSlugs, getSuggestedPosts, getAdjacentPosts } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import PortableTextRenderer from "@/components/blog/PortableTextRenderer";
import { extractHeadings } from "@/lib/portable-text-utils";
import TableOfContents from "@/components/blog/TableOfContents";
import SuggestedPosts from "@/components/blog/SuggestedPosts";
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
import TextSelectionShare from "@/components/blog/TextSelectionShare";
import KeyboardNav from "@/components/blog/KeyboardNav";
import SavePostButton from "@/components/blog/SavePostButton";
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

  const [suggestedGroups, { prev, next }] = await Promise.all([
    getSuggestedPosts(post._id, categorySlugs),
    getAdjacentPosts(post.publishedAt),
  ]);

  const featuredImageUrl = post.featuredImage?.asset
    ? urlFor(post.featuredImage).width(1200).url()
    : undefined;

  return (
    <>
      <ReadingProgress />
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

      <div className="mx-auto max-w-[90%] px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative flex justify-center gap-32">
          {/* Left sidebar — Table of Contents */}
          <aside className="hidden w-56 shrink-0 border-r border-border/30 pr-8 xl:block">
            <div className="sticky top-24">
              <TableOfContents headings={headings} />
              <div className="mt-6 border-t border-border/30 pt-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reading</p>
                <FontSizeToggle />
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Press <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px]">j</kbd> / <kbd className="rounded border border-border/50 px-1 py-0.5 text-[10px]">k</kbd> to navigate
                </p>
              </div>
            </div>
          </aside>

          {/* Center — Article card */}
          <article className="min-w-0 max-w-[1230px] flex-1">
            {/* Breadcrumbs */}
            <Breadcrumbs
              category={post.categories?.[0]}
              postTitle={post.title}
            />

            <div className="article-card overflow-hidden rounded-2xl border border-border bg-surface">
              {/* Featured image */}
              {post.featuredImage?.asset && (
                <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
                  <Image
                    src={urlFor(post.featuredImage).width(1400).quality(85).url()}
                    alt={post.featuredImage.alt || post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 1230px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                </div>
              )}
              {/* Gradient accent bar below image */}
              <div className="h-px bg-gradient-to-r from-accent/30 via-accent-2/20 to-transparent" />

              <div className="p-6 sm:p-10">
                {/* Header with staggered animations */}
                <header className="mb-8 border-b border-border pb-6">
                  <FadeUp>
                    {post.categories && post.categories.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {post.categories.map((cat) => (
                          <Link
                            key={cat.slug.current}
                            href={`/blog/category/${cat.slug.current}`}
                            className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent transition hover:bg-accent/20"
                          >
                            {cat.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </FadeUp>

                  <FadeUp delay={0.05}>
                    <div className="flex items-start gap-3">
                      <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">
                        {post.title}
                      </h1>
                      {post.isPremium && (
                        <span className="mt-1.5 shrink-0 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                          PRO
                        </span>
                      )}
                    </div>
                  </FadeUp>

                  <FadeUp delay={0.1}>
                    {post.excerpt && (
                      <p className="mt-3 text-base text-muted">{post.excerpt}</p>
                    )}
                  </FadeUp>

                  <FadeUp delay={0.15}>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      {post.author && (
                        <span className="flex items-center gap-1.5">
                          {post.author.image?.asset ? (
                            <Image
                              src={urlFor(post.author.image).width(32).height(32).url()}
                              alt={post.author.name}
                              width={24}
                              height={24}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                              {post.author.name.charAt(0)}
                            </span>
                          )}
                          {post.author.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {post.readingTime && (
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {post.readingTime} min read
                        </span>
                      )}
                      <ViewCounter slug={slug} />
                    </div>
                  </FadeUp>
                </header>

                {/* Article content */}
                <div id="article-content">
                  {post.content && <PortableTextRenderer content={post.content} />}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-border pt-6">
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {post.tags.map((tag) => (
                      <Link
                        key={tag.slug.current}
                        href={`/blog/tag/${tag.slug.current}`}
                        className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted transition hover:border-accent/30 hover:text-accent"
                      >
                        {tag.title}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Reactions */}
                <div className="mt-8 border-t border-border pt-6">
                  <PostReactions />
                </div>

                {/* Share & Save */}
                <div className="mt-6 flex items-center gap-3 border-t border-border pt-6">
                  <ShareButtons title={post.title} slug={slug} />
                  <SavePostButton postSlug={slug} />
                </div>

                {/* Author card */}
                {post.author && (
                  <div className="mt-8">
                    <AuthorCard
                      name={post.author.name}
                      bio={post.author.bio}
                      image={post.author.image}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Newsletter CTA */}
            <div className="mt-10">
              <NewsletterCTA />
            </div>

            {/* Prev/Next navigation */}
            <PostNavigation prev={prev} next={next} />
          </article>

          {/* Right sidebar — Suggested Posts */}
          <aside className="hidden w-56 shrink-0 border-l border-border/30 pl-8 xl:block">
            <div className="sticky top-24">
              <SuggestedPosts groups={suggestedGroups} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
