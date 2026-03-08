import { Suspense } from "react";
import Link from "next/link";
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
            {/* Featured post — large hero card (page 1, no filter) */}
            {featured && (
              <FadeUp delay={0.2}>
                <Link
                  href={`/blog/${featured.slug.current}`}
                  className="group card-glow mt-8 block overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-1"
                >
                  <div className="flex flex-col lg:flex-row">
                    <div className="relative aspect-[16/9] w-full overflow-hidden lg:aspect-auto lg:w-1/2">
                      {featured.featuredImage?.asset ? (
                        <img
                          src={urlFor(featured.featuredImage)
                            .width(800)
                            .height(450)
                            .quality(85)
                            .url()}
                          alt={featured.featuredImage.alt || featured.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent-2/20">
                          <svg className="h-16 w-16 text-accent/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-surface/60" />
                      {featured.isPremium && (
                        <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-[#0f172a]">
                          PRO
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10">
                      {featured.categories && featured.categories.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {featured.categories.map((cat) => (
                            <span key={cat.slug.current} className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                              {cat.title}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="mt-3 text-muted line-clamp-3">{featured.excerpt}</p>
                      )}
                      <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
                        {featured.author && (
                          <span className="flex items-center gap-2">
                            {featured.author.image?.asset ? (
                              <img src={urlFor(featured.author.image).width(32).height(32).url()} alt={featured.author.name} className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                {featured.author.name.charAt(0)}
                              </span>
                            )}
                            {featured.author.name}
                          </span>
                        )}
                        <span>
                          {new Date(featured.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {featured.readingTime && <span>{featured.readingTime} min read</span>}
                      </div>
                      <div className="mt-6">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-accent transition group-hover:gap-3">
                          Read article
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            )}

            {/* Post grid */}
            {gridPosts.length > 0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post, i) => (
                  <FadeUp key={post._id} delay={0.05 * i}>
                    <Link
                      href={`/blog/${post.slug.current}`}
                      className="group card-glow flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:-translate-y-1"
                    >
                      <div className="relative aspect-[16/9] w-full overflow-hidden">
                        {post.featuredImage?.asset ? (
                          <img
                            src={urlFor(post.featuredImage).width(600).height(340).quality(80).url()}
                            alt={post.featuredImage.alt || post.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10">
                            <svg className="h-10 w-10 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
                        {post.isPremium && (
                          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-[#0f172a]">
                            PRO
                          </span>
                        )}
                        <div className="absolute left-3 top-3">
                          <SavePostButton postSlug={post.slug.current} iconOnly />
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        {post.categories && post.categories.length > 0 && (
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            {post.categories.map((cat) => (
                              <span key={cat.slug.current} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                                {cat.title}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="text-lg font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                        )}
                        <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-4 text-xs text-muted-foreground">
                          {post.author && (
                            <span className="flex items-center gap-1.5">
                              {post.author.image?.asset ? (
                                <img src={urlFor(post.author.image).width(24).height(24).url()} alt={post.author.name} className="h-5 w-5 rounded-full object-cover" />
                              ) : (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                                  {post.author.name.charAt(0)}
                                </span>
                              )}
                              {post.author.name}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                          </span>
                          {post.readingTime && (
                            <span className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {post.readingTime}m
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </FadeUp>
                ))}
              </div>
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
