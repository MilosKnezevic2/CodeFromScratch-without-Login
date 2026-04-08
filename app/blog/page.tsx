import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getPosts,
  getPostsByCategory,
  getPostsByTag,
  getCategoriesWithCounts,
  getTagsWithCategory,
  searchPosts,
} from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import FadeUp from "@/components/animations/FadeUp";
import CategoryFilter from "@/components/blog/CategoryFilter";
import SavePostButton from "@/components/blog/SavePostButton";

export const metadata: Metadata = {
  title: "Blog | CodeFromScratch",
  description:
    "Read the latest web development articles, tutorials, and guides.",
  openGraph: {
    title: "Blog | CodeFromScratch",
    description:
      "Read the latest web development articles, tutorials, and guides.",
  },
};

export const revalidate = 60;

/** Build a windowed page number list: 1 ... 4 5 [6] 7 8 ... 80 */
function getPageWindow(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "...")[] = [];
  const near = new Set<number>();
  near.add(1);
  near.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) near.add(i);
  }
  const sorted = [...near].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push("...");
    pages.push(sorted[i]);
  }
  return pages;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const activeCategory = params.category || "";
  const activeTag = params.tag || "";
  const searchQuery = params.q || "";
  const activeSort = (params.sort === "oldest" ? "oldest" : "newest") as "newest" | "oldest";
  const LIMIT = 12;

  const [result, categories, allTags] = await Promise.all([
    searchQuery
      ? searchPosts(searchQuery, page, LIMIT)
      : activeTag
        ? getPostsByTag(activeTag, page, LIMIT)
        : activeCategory
          ? getPostsByCategory(activeCategory, page, LIMIT)
          : getPosts(page, LIMIT, activeSort),
    getCategoriesWithCounts(),
    getTagsWithCategory(),
  ]);

  const { posts, pages: totalPages } = result;

  const activeCatObj = activeCategory
    ? categories.find((c) => c.slug.current === activeCategory)
    : null;
  const activeTagObj = activeTag
    ? allTags.find((t) => t.slug.current === activeTag)
    : null;

  const visibleTags = activeCategory
    ? allTags.filter((t) => t.categorySlug === activeCategory)
    : allTags;

  const isFiltered = !!(activeCategory || activeTag || searchQuery);
  const showFeatured = page === 1 && !isFiltered && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;

  // Split grid posts into showcase (first 4) and editorial (rest)
  const showcasePosts = gridPosts.slice(0, 4);
  const editorialPosts = gridPosts.slice(4);

  const pageWindow = getPageWindow(page, totalPages);

  function pageHref(p: number) {
    const parts = [`page=${p}`];
    if (searchQuery) parts.push(`q=${encodeURIComponent(searchQuery)}`);
    if (activeCategory) parts.push(`category=${activeCategory}`);
    if (activeTag) parts.push(`tag=${activeTag}`);
    if (activeSort !== "newest") parts.push(`sort=${activeSort}`);
    return `/blog?${parts.join("&")}`;
  }

  function sortHref(sort: string) {
    const parts: string[] = [];
    if (activeCategory) parts.push(`category=${activeCategory}`);
    if (activeTag) parts.push(`tag=${activeTag}`);
    if (sort !== "newest") parts.push(`sort=${sort}`);
    return `/blog${parts.length > 0 ? "?" + parts.join("&") : ""}`;
  }

  return (
    <div>
      {/* ── Hero with animated mesh background ── */}
      <section className="blog-hero-mesh relative overflow-hidden bg-background px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="blog-particle absolute left-[15%] top-[30%]" style={{ animationDelay: "0s" }} />
          <div className="blog-particle absolute left-[45%] top-[60%]" style={{ animationDelay: "1.5s" }} />
          <div className="blog-particle absolute left-[75%] top-[25%]" style={{ animationDelay: "3s" }} />
          <div className="blog-particle absolute left-[60%] top-[70%]" style={{ animationDelay: "4.5s" }} />
          <div className="blog-particle absolute left-[30%] top-[50%]" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative mx-auto max-w-6xl text-center">
          <FadeUp>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">
                Latest Articles
              </span>
            </div>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Tutorials, Guides &{" "}
              <span className="gradient-text">Deep Dives</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
              Practical web development articles to sharpen your skills and build
              real-world projects.
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Category & tag filter */}
        {categories.length > 0 && (
          <FadeUp delay={0.15} className="relative z-[100]">
            <Suspense fallback={null}>
              <CategoryFilter
                categories={categories}
                tags={visibleTags}
                activeCategory={activeCategory}
                activeTag={activeTag}
                activeCategoryLabel={activeCatObj?.title}
                activeTagLabel={activeTagObj?.title}
                searchQuery={searchQuery}
              />
            </Suspense>
          </FadeUp>
        )}

        {/* Sort options */}
        {!searchQuery && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Sort:</span>
            {(["newest", "oldest"] as const).map((s) => (
              <Link
                key={s}
                href={sortHref(s)}
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activeSort === s
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "newest" ? "Newest" : "Oldest"}
              </Link>
            ))}
          </div>
        )}

        {/* Active filter heading */}
        {(activeCatObj || activeTagObj) && (
          <FadeUp delay={0.18}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {activeCatObj && (
                <>
                  <h2 className="text-xl font-semibold text-foreground">
                    {activeCatObj.title}
                  </h2>
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted-foreground">
                    {activeCatObj.postCount} {activeCatObj.postCount === 1 ? "post" : "posts"}
                  </span>
                </>
              )}
              {activeTagObj && (
                <>
                  {activeCatObj && <span className="text-muted-foreground">/</span>}
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                    {activeTagObj.title}
                  </span>
                </>
              )}
            </div>
          </FadeUp>
        )}

        {posts.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">
              <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-lg text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No posts found."}
            </p>
            {isFiltered && (
              <Link
                href="/blog"
                className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Clear filters & view all posts
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ═══════════════════════════════════════════════════
                ██ FEATURED POST — Cinematic full-bleed hero card
                ═══════════════════════════════════════════════════ */}
            {featured && (
              <FadeUp delay={0.2}>
                <Link
                  href={`/blog/${featured.slug.current}`}
                  className="blog-card group mt-10 block rounded-3xl"
                  style={{ borderRadius: "1.5rem", overflow: "hidden" }}
                >
                  <div className="relative min-h-[280px] sm:min-h-[380px] lg:min-h-[480px]">
                    {/* Full bleed image with zoom on hover */}
                    {featured.featuredImage?.asset ? (
                      <Image
                        src={urlFor(featured.featuredImage).width(1600).height(700).quality(90).url()}
                        alt={featured.featuredImage.alt || featured.title}
                        fill
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface to-accent-2/20" />
                    )}

                    {/* Multi-layer gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

                    {/* Top badges row */}
                    <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="badge-glow rounded-full px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider">
                          Featured
                        </span>
                        {featured.isPremium && (
                          <span className="glass-pill rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white">
                            PRO
                          </span>
                        )}
                      </div>
                      {featured.readingTime && (
                        <span className="glass-pill flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium text-white">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {featured.readingTime} min read
                        </span>
                      )}
                    </div>

                    {/* Bottom content overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                      {featured.categories && featured.categories.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {featured.categories.map((cat) => (
                            <span key={cat.slug.current} className="glass-pill rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                              {cat.title}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="hover-underline inline max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base lg:text-lg line-clamp-2">
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="mt-6 flex items-center gap-5">
                        {featured.author && (
                          <span className="flex items-center gap-2.5">
                            {featured.author.image?.asset ? (
                              <Image
                                src={urlFor(featured.author.image).width(40).height(40).url()}
                                alt={featured.author.name}
                                width={32}
                                height={32}
                                className="rounded-full object-cover ring-2 ring-white/20"
                              />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                                {featured.author.name.charAt(0)}
                              </span>
                            )}
                            <span className="text-sm font-medium text-white/90">{featured.author.name}</span>
                          </span>
                        )}
                        <span className="text-sm text-white/50">
                          {new Date(featured.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                        {/* Read arrow */}
                        <span className="ml-auto flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition group-hover:border-accent group-hover:bg-accent group-hover:text-[#0f172a] sm:px-4 sm:py-2 sm:text-sm">
                          Read Article
                          <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            )}

            {/* ═══════════════════════════════════════════════════
                ██ SHOWCASE GRID — 2x2 premium cards
                ═══════════════════════════════════════════════════ */}
            {showcasePosts.length > 0 && (
              <div className="mt-12 grid gap-6 sm:grid-cols-2">
                {showcasePosts.map((post, i) => (
                  <FadeUp key={post._id} delay={0.08 * i} className="stagger-enter">
                    <Link
                      href={`/blog/${post.slug.current}`}
                      className="blog-card group flex h-full flex-col rounded-2xl"
                      style={{ borderRadius: "1rem", overflow: "hidden" }}
                    >
                      {/* Image section */}
                      <div className="img-shine relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl" style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                        {post.featuredImage?.asset ? (
                          <Image
                            src={urlFor(post.featuredImage).width(800).height(500).quality(80).url()}
                            alt={post.featuredImage.alt || post.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 via-surface to-accent-2/10">
                            <svg className="h-14 w-14 text-accent/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                            </svg>
                          </div>
                        )}
                        {/* Gradient fade at bottom */}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />

                        {/* Badges floating on image */}
                        <div className="absolute left-3.5 right-3.5 top-3.5 flex items-center justify-between">
                          <div className="flex gap-2">
                            {post.isPremium && (
                              <span className="badge-glow rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide">
                                PRO
                              </span>
                            )}
                          </div>
                          {post.readingTime && (
                            <span className="glass-pill flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-white">
                              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {post.readingTime} min
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content section */}
                      <div className="flex flex-1 flex-col p-5 sm:p-6">
                        {post.categories && post.categories.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-2">
                            {post.categories.slice(0, 2).map((cat) => (
                              <span key={cat.slug.current} className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                                {cat.title}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="hover-underline inline text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-xl line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                          <div className="flex items-center gap-2.5">
                            {post.author && (
                              <>
                                {post.author.image?.asset ? (
                                  <Image
                                    src={urlFor(post.author.image).width(28).height(28).url()}
                                    alt={post.author.name}
                                    width={22}
                                    height={22}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent">
                                    {post.author.name.charAt(0)}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-muted-foreground">{post.author.name}</span>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </FadeUp>
                ))}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════
                ██ EDITORIAL LIST — Remaining posts
                ═══════════════════════════════════════════════════ */}
            {editorialPosts.length > 0 && (
              <div className="mt-16">
                {/* Section header */}
                <FadeUp delay={0.1}>
                  <div className="mb-10 flex items-center gap-5">
                    <div className="section-divider w-16" />
                    <h2 className="whitespace-nowrap text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      More Articles
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </FadeUp>

                <div className="space-y-3">
                  {editorialPosts.map((post, i) => (
                    <FadeUp key={post._id} delay={0.04 * i}>
                      <Link
                        href={`/blog/${post.slug.current}`}
                        className="editorial-item group flex items-center gap-5 overflow-hidden rounded-xl border border-border bg-surface/50 p-4 sm:gap-6 sm:p-5"
                      >
                        {/* Number */}
                        <span className="gradient-number hidden shrink-0 text-4xl font-black leading-none sm:block">
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        {/* Thumbnail */}
                        <div className="img-shine relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-[72px] sm:w-[72px]">
                          {post.featuredImage?.asset ? (
                            <Image
                              src={urlFor(post.featuredImage).width(160).height(160).quality(75).url()}
                              alt={post.featuredImage.alt || post.title}
                              fill
                              sizes="80px"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10 rounded-xl">
                              <svg className="h-6 w-6 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex items-center gap-2">
                            {post.categories && post.categories.length > 0 && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                                {post.categories[0].title}
                              </span>
                            )}
                            {post.isPremium && (
                              <span className="badge-glow rounded px-1.5 py-px text-[9px] font-extrabold">
                                PRO
                              </span>
                            )}
                          </div>
                          <h3 className="hover-underline inline text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-accent sm:text-base line-clamp-1">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-xs text-muted line-clamp-1">{post.excerpt}</p>
                          )}
                        </div>

                        {/* Meta — right side */}
                        <div className="hidden shrink-0 flex-col items-end gap-1.5 text-xs text-muted-foreground sm:flex">
                          <span className="font-medium">
                            {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {post.readingTime && (
                            <span className="flex items-center gap-1 text-accent/60">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {post.readingTime} min
                            </span>
                          )}
                        </div>

                        {/* Arrow — desktop only */}
                        <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-all group-hover:border-accent group-hover:bg-accent/10 sm:flex">
                          <svg className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </Link>
                    </FadeUp>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-1.5">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Previous
              </Link>
            )}

            <div className="flex items-center gap-1 px-2">
              {pageWindow.map((item, idx) =>
                item === "..." ? (
                  <span key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-sm text-muted-foreground">
                    &hellip;
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={pageHref(item)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                      item === page
                        ? "bg-gradient-to-r from-accent to-accent-2 text-[#0f172a] shadow-lg shadow-accent/20"
                        : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {item}
                  </Link>
                )
              )}
            </div>

            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
              >
                Next
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
