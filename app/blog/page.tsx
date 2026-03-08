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
  searchParams: Promise<{ page?: string; category?: string; tag?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const activeCategory = params.category || "";
  const activeTag = params.tag || "";
  const searchQuery = params.q || "";
  const LIMIT = 12;

  // Fetch data in parallel — search takes priority over category/tag filters
  const [result, categories, allTags] = await Promise.all([
    searchQuery
      ? searchPosts(searchQuery, page, LIMIT)
      : activeTag
        ? getPostsByTag(activeTag, page, LIMIT)
        : activeCategory
          ? getPostsByCategory(activeCategory, page, LIMIT)
          : getPosts(page, LIMIT),
    getCategoriesWithCounts(),
    getTagsWithCategory(),
  ]);

  const { posts, pages: totalPages } = result;

  // Find active category/tag labels
  const activeCatObj = activeCategory
    ? categories.find((c) => c.slug.current === activeCategory)
    : null;
  const activeTagObj = activeTag
    ? allTags.find((t) => t.slug.current === activeTag)
    : null;

  // Tags for the selected category
  const visibleTags = activeCategory
    ? allTags.filter((t) => t.categorySlug === activeCategory)
    : allTags;

  const isFiltered = !!(activeCategory || activeTag || searchQuery);
  const showFeatured = page === 1 && !isFiltered && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;

  const pageWindow = getPageWindow(page, totalPages);

  function pageHref(p: number) {
    const parts = [`page=${p}`];
    if (searchQuery) parts.push(`q=${encodeURIComponent(searchQuery)}`);
    if (activeCategory) parts.push(`category=${activeCategory}`);
    if (activeTag) parts.push(`tag=${activeTag}`);
    return `/blog?${parts.join("&")}`;
  }

  return (
    <div>
      {/* Hero header */}
      <section className="gradient-hero relative overflow-hidden px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <FadeUp>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
              CodeFromScratch Blog
            </p>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Tutorials, Guides &{" "}
              <span className="gradient-text">Deep Dives</span>
            </h1>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
              Practical web development articles to sharpen your skills and build
              real-world projects.
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
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
          <div className="mt-16 text-center">
            <p className="text-lg text-muted-foreground">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : "No posts found."}
            </p>
            {isFiltered && (
              <Link
                href="/blog"
                className="mt-4 inline-block text-sm text-accent hover:underline"
              >
                Clear filters & view all posts
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Featured post — cinematic full-width card */}
            {featured && (
              <FadeUp delay={0.2}>
                <Link
                  href={`/blog/${featured.slug.current}`}
                  className="blog-card group mt-8 block overflow-hidden rounded-2xl border border-border bg-surface"
                >
                  <div className="relative min-h-[320px] sm:min-h-[400px] lg:min-h-[440px]">
                    {/* Full bleed image */}
                    {featured.featuredImage?.asset ? (
                      <Image
                        src={urlFor(featured.featuredImage).width(1400).height(600).quality(85).url()}
                        alt={featured.featuredImage.alt || featured.title}
                        fill
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent-2/20" />
                    )}
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

                    {/* Badges */}
                    <div className="absolute left-5 top-5 flex items-center gap-2">
                      <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-[#0f172a]">
                        FEATURED
                      </span>
                      {featured.isPremium && (
                        <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                          PRO
                        </span>
                      )}
                    </div>

                    {/* Reading time pill */}
                    {featured.readingTime && (
                      <span className="reading-pill absolute right-5 top-5 rounded-full px-3 py-1 text-[11px] font-medium text-white">
                        {featured.readingTime} min read
                      </span>
                    )}

                    {/* Content overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                      {featured.categories && featured.categories.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {featured.categories.map((cat) => (
                            <span key={cat.slug.current} className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                              {cat.title}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base line-clamp-2">{featured.excerpt}</p>
                      )}
                      <div className="mt-5 flex items-center gap-4 text-sm text-white/60">
                        {featured.author && (
                          <span className="flex items-center gap-2">
                            {featured.author.image?.asset ? (
                              <Image src={urlFor(featured.author.image).width(32).height(32).url()} alt={featured.author.name} width={24} height={24} className="rounded-full object-cover ring-2 ring-white/20" />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                                {featured.author.name.charAt(0)}
                              </span>
                            )}
                            <span className="text-white/80">{featured.author.name}</span>
                          </span>
                        )}
                        <span>
                          {new Date(featured.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            )}

            {/* Bento grid — top 4 posts in asymmetric layout */}
            {gridPosts.length > 0 && (
              <>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-2">
                  {gridPosts.slice(0, 4).map((post, i) => {
                    const isLarge = i === 0;
                    return (
                      <FadeUp key={post._id} delay={0.05 * i}>
                        <Link
                          href={`/blog/${post.slug.current}`}
                          className={`blog-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface ${isLarge ? "lg:col-span-2 lg:row-span-2" : ""}`}
                        >
                          <div className={`img-shine relative w-full overflow-hidden ${isLarge ? "aspect-[16/10]" : "aspect-[16/9]"}`}>
                            {post.featuredImage?.asset ? (
                              <Image
                                src={urlFor(post.featuredImage).width(isLarge ? 900 : 600).height(isLarge ? 560 : 340).quality(80).url()}
                                alt={post.featuredImage.alt || post.title}
                                fill
                                sizes={isLarge ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
                                className="object-cover transition-transform duration-600 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10">
                                <svg className="h-12 w-12 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                                </svg>
                              </div>
                            )}
                            {/* Gradient fade at bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
                            {post.isPremium && (
                              <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-[#0f172a]">
                                PRO
                              </span>
                            )}
                            {post.readingTime && (
                              <span className="reading-pill absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-medium text-white">
                                {post.readingTime} min
                              </span>
                            )}
                          </div>

                          <div className={`flex flex-1 flex-col ${isLarge ? "p-6 sm:p-8" : "p-5"}`}>
                            {post.categories && post.categories.length > 0 && (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {post.categories.slice(0, 2).map((cat) => (
                                  <span key={cat.slug.current} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                                    {cat.title}
                                  </span>
                                ))}
                              </div>
                            )}
                            <h3 className={`font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2 ${isLarge ? "text-xl sm:text-2xl" : "text-base"}`}>
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className={`mt-2 flex-1 text-muted line-clamp-2 ${isLarge ? "text-sm sm:text-base leading-relaxed" : "text-sm"}`}>{post.excerpt}</p>
                            )}
                            <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                              {post.author && (
                                <span className="flex items-center gap-1.5">
                                  {post.author.image?.asset ? (
                                    <Image src={urlFor(post.author.image).width(24).height(24).url()} alt={post.author.name} width={18} height={18} className="rounded-full object-cover" />
                                  ) : (
                                    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent">
                                      {post.author.name.charAt(0)}
                                    </span>
                                  )}
                                  {post.author.name}
                                </span>
                              )}
                              <span className="ml-auto">
                                {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </FadeUp>
                    );
                  })}
                </div>

                {/* Remaining posts — editorial list */}
                {gridPosts.length > 4 && (
                  <div className="mt-14">
                    <div className="mb-8 flex items-center gap-4">
                      <div className="h-px w-12 bg-gradient-to-r from-accent to-accent-2" />
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">More Articles</h2>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                    <div className="space-y-4">
                      {gridPosts.slice(4).map((post, i) => (
                        <FadeUp key={post._id} delay={0.03 * i}>
                          <Link
                            href={`/blog/${post.slug.current}`}
                            className="blog-card group flex items-center gap-5 rounded-xl border border-border bg-surface p-4 sm:p-5"
                          >
                            {/* Number */}
                            <span className="post-number hidden shrink-0 text-3xl font-black sm:block">
                              {String(i + 1).padStart(2, "0")}
                            </span>

                            {/* Thumbnail */}
                            <div className="img-shine relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                              {post.featuredImage?.asset ? (
                                <Image
                                  src={urlFor(post.featuredImage).width(160).height(160).quality(75).url()}
                                  alt={post.featuredImage.alt || post.title}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10">
                                  <svg className="h-6 w-6 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-center gap-2">
                                {post.categories && post.categories.length > 0 && (
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                                    {post.categories[0].title}
                                  </span>
                                )}
                                {post.isPremium && (
                                  <span className="rounded bg-accent/15 px-1.5 py-px text-[9px] font-bold text-accent">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <h3 className="mt-1 text-sm font-bold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-1 sm:text-base">
                                {post.title}
                              </h3>
                              {post.excerpt && (
                                <p className="mt-0.5 hidden text-sm text-muted line-clamp-1 sm:block">{post.excerpt}</p>
                              )}
                            </div>

                            {/* Meta — right side */}
                            <div className="hidden shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground sm:flex">
                              <span>
                                {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                              {post.readingTime && (
                                <span className="text-accent/70">{post.readingTime} min read</span>
                              )}
                            </div>

                            {/* Arrow */}
                            <svg className="hidden h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </Link>
                        </FadeUp>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Windowed pagination */}
        {totalPages > 1 && (
          <nav className="mt-14 flex items-center justify-center gap-1">
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
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
                  <span key={`ellipsis-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
                    &hellip;
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={pageHref(item)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                      item === page
                        ? "bg-accent text-[#0f172a]"
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
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
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
