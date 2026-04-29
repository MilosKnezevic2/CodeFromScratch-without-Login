import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getPostsAdvanced,
  getCategoriesWithCounts,
  getTagsWithCategory,
  getFeaturedAuthors,
} from "@/lib/sanity/queries";
import { getBlogHeroStats } from "@/lib/sanity/hero-stats";
import {
  getTrendingPosts,
  getEditorPicks,
  getRecentlyUpdatedPosts,
} from "@/lib/sanity/discovery";
import {
  getContinueReading,
  getSavedForLater,
  getReadSlugs,
} from "@/lib/sanity/personalisation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { urlFor } from "@/lib/sanity/image";
import FadeUp from "@/components/animations/FadeUp";
import CategoryFilter from "@/components/blog/CategoryFilter";
import BlogHero from "@/components/blog/BlogHero";
import BlogToolbar from "@/components/blog/BlogToolbar";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import ActiveFilterChips, {
  type FilterChip,
} from "@/components/blog/ActiveFilterChips";
import DiscoveryRail from "@/components/blog/DiscoveryRail";
import InlineNewsletterCard from "@/components/blog/InlineNewsletterCard";
import SavePostButton from "@/components/blog/SavePostButton";
import ContinueReadingRail from "@/components/blog/ContinueReadingRail";
import SavedForLaterRail from "@/components/blog/SavedForLaterRail";
import HideReadToggle from "@/components/blog/HideReadToggle";
import ChipFilters from "@/components/blog/ChipFilters";
import CommandPalette from "@/components/blog/CommandPalette";
import TopicSpotlight from "@/components/blog/TopicSpotlight";
import AuthorSpotlight from "@/components/blog/AuthorSpotlight";
import JsonLd from "@/components/seo/JsonLd";
import {
  itemListJsonLd,
  blogCollectionJsonLd,
  breadcrumbJsonLd,
} from "@/lib/seo";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

const PAGE_TITLE = "Blog";
const PAGE_DESCRIPTION =
  "Read the latest web development articles, tutorials, and guides.";

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: string;
  }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const canonicalParts: string[] = [];
  if (params.category) canonicalParts.push(`category=${params.category}`);
  if (params.tag) canonicalParts.push(`tag=${params.tag}`);
  if (params.q) canonicalParts.push(`q=${params.q}`);
  if (page > 1) canonicalParts.push(`page=${page}`);
  if (params.sort === "oldest") canonicalParts.push("sort=oldest");
  const canonical =
    canonicalParts.length > 0
      ? `${SITE_URL}/blog?${canonicalParts.join("&")}`
      : `${SITE_URL}/blog`;
  return {
    title: `${PAGE_TITLE} | CodeFromScratch`,
    description: PAGE_DESCRIPTION,
    openGraph: {
      title: `${PAGE_TITLE} | CodeFromScratch`,
      description: PAGE_DESCRIPTION,
      url: canonical,
      type: "website",
    },
    alternates: {
      canonical,
      types: {
        "application/rss+xml": `${SITE_URL}/blog/rss.xml`,
        "application/atom+xml": `${SITE_URL}/blog/atom.xml`,
        "application/feed+json": `${SITE_URL}/blog/feed.json`,
      },
    },
  };
}

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
    if (i > 0 && (sorted[i] ?? 0) - (sorted[i - 1] ?? 0) > 1) pages.push("...");
    pages.push(sorted[i] ?? 0);
  }
  return pages;
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
    q?: string;
    sort?: string;
    hideRead?: string;
    readingTime?: string;
    difficulty?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const activeCategory = params.category || "";
  const activeTag = params.tag || "";
  const searchQuery = params.q || "";
  const activeSort = (params.sort === "oldest" ? "oldest" : "newest") as
    | "newest"
    | "oldest";
  const hideReadActive = params.hideRead === "1";
  const readingTimeFilter = (
    ["short", "medium", "long"] as const
  ).find((v) => v === params.readingTime);
  const difficultyFilter = (
    ["beginner", "intermediate", "advanced"] as const
  ).find((v) => v === params.difficulty);
  const LIMIT = 12;

  const isHomeState =
    page === 1 &&
    !activeCategory &&
    !activeTag &&
    !searchQuery &&
    !readingTimeFilter &&
    !difficultyFilter;

  const currentUser = await getCurrentUser();
  const userId = currentUser?.id ?? null;

  const [
    result,
    categories,
    allTags,
    heroStats,
    trending,
    editorPicks,
    recentlyUpdated,
    continueReading,
    savedForLater,
    readSlugs,
    featuredAuthors,
  ] = await Promise.all([
    getPostsAdvanced({
      page,
      limit: LIMIT,
      sort: activeSort,
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(activeTag ? { tag: activeTag } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(readingTimeFilter ? { readingTime: readingTimeFilter } : {}),
      ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
    }),
    getCategoriesWithCounts(),
    getTagsWithCategory(),
    getBlogHeroStats(),
    isHomeState ? getTrendingPosts(7, 5) : Promise.resolve([]),
    isHomeState ? getEditorPicks(3) : Promise.resolve([]),
    isHomeState ? getRecentlyUpdatedPosts(14, 4) : Promise.resolve([]),
    isHomeState && userId
      ? getContinueReading(userId, 4)
      : Promise.resolve([]),
    isHomeState && userId ? getSavedForLater(userId, 4) : Promise.resolve([]),
    userId && hideReadActive
      ? getReadSlugs(userId)
      : Promise.resolve(new Set<string>()),
    isHomeState ? getFeaturedAuthors(6) : Promise.resolve([]),
  ]);

  const { posts: allPosts, pages: totalPages } = result;
  const posts =
    hideReadActive && readSlugs.size > 0
      ? allPosts.filter((p) => !readSlugs.has(p.slug.current))
      : allPosts;

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
  const showcasePosts = gridPosts.slice(0, 4);
  const editorialPosts = gridPosts.slice(4);

  const pageWindow = getPageWindow(page, totalPages);

  function buildHref(
    overrides: Partial<Record<string, string | null>>,
  ): string {
    const current: Record<string, string> = {
      ...(page > 1 ? { page: String(page) } : {}),
      ...(searchQuery ? { q: searchQuery } : {}),
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(activeTag ? { tag: activeTag } : {}),
      ...(activeSort !== "newest" ? { sort: activeSort } : {}),
      ...(hideReadActive ? { hideRead: "1" } : {}),
      ...(readingTimeFilter ? { readingTime: readingTimeFilter } : {}),
      ...(difficultyFilter ? { difficulty: difficultyFilter } : {}),
    };
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) delete current[k];
      else if (v !== undefined) current[k] = v;
    }
    const params = new URLSearchParams(current);
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  function pageHref(p: number) {
    return buildHref({ page: p > 1 ? String(p) : null });
  }

  function hideReadHref() {
    return buildHref({ hideRead: hideReadActive ? null : "1" });
  }

  // Active filter chips
  const filterChips: FilterChip[] = [];
  if (activeCatObj) {
    const removeParams: string[] = [];
    if (searchQuery) removeParams.push(`q=${encodeURIComponent(searchQuery)}`);
    if (activeTag) removeParams.push(`tag=${activeTag}`);
    if (activeSort !== "newest") removeParams.push(`sort=${activeSort}`);
    filterChips.push({
      label: "Category",
      value: activeCatObj.title,
      removeHref:
        removeParams.length > 0 ? `/blog?${removeParams.join("&")}` : "/blog",
      tone: "category",
    });
  }
  if (activeTagObj) {
    const removeParams: string[] = [];
    if (searchQuery) removeParams.push(`q=${encodeURIComponent(searchQuery)}`);
    if (activeCategory) removeParams.push(`category=${activeCategory}`);
    if (activeSort !== "newest") removeParams.push(`sort=${activeSort}`);
    filterChips.push({
      label: "Tag",
      value: activeTagObj.title,
      removeHref:
        removeParams.length > 0 ? `/blog?${removeParams.join("&")}` : "/blog",
      tone: "tag",
    });
  }
  if (searchQuery) {
    filterChips.push({
      label: "Search",
      value: searchQuery,
      removeHref: buildHref({ q: null, page: null }),
      tone: "search",
    });
  }
  if (readingTimeFilter) {
    const labelMap = { short: "≤ 5 min", medium: "≤ 12 min", long: "Deep dive" };
    filterChips.push({
      label: "Reading",
      value: labelMap[readingTimeFilter],
      removeHref: buildHref({ readingTime: null, page: null }),
      tone: "sort",
    });
  }
  if (difficultyFilter) {
    filterChips.push({
      label: "Difficulty",
      value:
        difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1),
      removeHref: buildHref({ difficulty: null, page: null }),
      tone: "sort",
    });
  }

  // Breadcrumbs (only for filtered views)
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Blog", href: isFiltered ? "/blog" : undefined },
  ];
  if (activeCatObj) {
    breadcrumbItems.push({
      label: activeCatObj.title,
      href: activeTagObj
        ? `/blog?category=${activeCategory}`
        : undefined,
    });
  }
  if (activeTagObj) {
    breadcrumbItems.push({ label: `#${activeTagObj.title}` });
  }
  if (searchQuery && !activeCatObj && !activeTagObj) {
    breadcrumbItems.push({ label: `Search: ${searchQuery}` });
  }

  const listItems = posts.map((p) => ({
    name: p.title,
    url: `${SITE_URL}/blog/${p.slug.current}`,
  }));

  const canonicalUrl = `${SITE_URL}${pageHref(page)}`;
  const collectionName =
    activeCatObj?.title ?? activeTagObj?.title ?? "Blog";

  return (
    <div>
      {/* SEO: Blog (CollectionPage) + ItemList + (when filtered) Breadcrumb */}
      <JsonLd
        data={blogCollectionJsonLd({
          url: canonicalUrl,
          name: `${collectionName} | CodeFromScratch`,
          description: PAGE_DESCRIPTION,
        })}
      />
      {listItems.length > 0 && <JsonLd data={itemListJsonLd(listItems)} />}
      {isFiltered && (
        <JsonLd
          data={breadcrumbJsonLd(
            breadcrumbItems
              .filter((b) => b.href || b === breadcrumbItems[breadcrumbItems.length - 1])
              .map((b) => ({
                name: b.label,
                url: `${SITE_URL}${b.href ?? pageHref(1)}`,
              })),
          )}
        />
      )}

      {/* prev/next link relationships for pagination */}
      {page > 1 && (
        <link rel="prev" href={`${SITE_URL}${pageHref(page - 1)}`} />
      )}
      {page < totalPages && (
        <link rel="next" href={`${SITE_URL}${pageHref(page + 1)}`} />
      )}

      <CommandPalette />
      <BlogHero stats={heroStats} />

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        {isFiltered && (
          <FadeUp delay={0.05}>
            <div className="mt-8">
              <BlogBreadcrumb items={breadcrumbItems} />
            </div>
          </FadeUp>
        )}

        {/* Toolbar */}
        <FadeUp delay={0.1}>
          <div className={isFiltered ? "mt-3" : "mt-10"}>
            <BlogToolbar
              initialSearch={searchQuery}
              activeSort={activeSort}
              preserveQuery={{
                ...(activeCategory ? { category: activeCategory } : {}),
                ...(activeTag ? { tag: activeTag } : {}),
                ...(activeSort !== "newest" ? { sort: activeSort } : {}),
              }}
            />
          </div>
        </FadeUp>

        {/* Chip filters: reading time + difficulty */}
        <FadeUp delay={0.13}>
          <div className="mt-4">
            <ChipFilters
              value={{
                readingTime: readingTimeFilter ?? "",
                difficulty: difficultyFilter ?? "",
              }}
              buildHref={buildHref}
            />
          </div>
        </FadeUp>

        {/* Active filter chips + hide-read toggle */}
        {(filterChips.length > 0 || userId) && (
          <FadeUp delay={0.12}>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {filterChips.length > 0 && (
                <ActiveFilterChips chips={filterChips} clearHref="/blog" />
              )}
              {userId && (
                <HideReadToggle
                  active={hideReadActive}
                  toggleHref={hideReadHref()}
                />
              )}
            </div>
          </FadeUp>
        )}

        {/* Category & tag filter */}
        {categories.length > 0 && (
          <FadeUp delay={0.15} className="relative z-[100] mt-4">
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

        {posts.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">
              <svg
                className="h-10 w-10 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
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
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
                Clear filters &amp; view all posts
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ═══════════ FEATURED POST ═══════════ */}
            {featured && (
              <FadeUp delay={0.2}>
                <Link
                  href={`/blog/${featured.slug.current}`}
                  className="blog-card group mt-10 block rounded-3xl"
                  style={{ borderRadius: "1.5rem", overflow: "hidden" }}
                >
                  <div className="relative min-h-[280px] sm:min-h-[380px] lg:min-h-[480px]">
                    {featured.featuredImage?.asset ? (
                      <Image
                        src={urlFor(featured.featuredImage)
                          .width(1600)
                          .height(700)
                          .quality(90)
                          .url()}
                        alt={featured.featuredImage.alt || featured.title}
                        fill
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-surface to-accent-2/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
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
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {featured.readingTime} min read
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-10">
                      {featured.categories &&
                        featured.categories.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-2">
                            {featured.categories.map((cat) => (
                              <span
                                key={cat.slug.current}
                                className="glass-pill rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                              >
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
                                src={urlFor(featured.author.image)
                                  .width(40)
                                  .height(40)
                                  .url()}
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
                            <span className="text-sm font-medium text-white/90">
                              {featured.author.name}
                            </span>
                          </span>
                        )}
                        <span className="text-sm text-white/50">
                          {new Date(featured.publishedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span className="ml-auto flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition group-hover:border-accent group-hover:bg-accent group-hover:text-[#0f172a] sm:px-4 sm:py-2 sm:text-sm">
                          Read article
                          <svg
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                            />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            )}

            {/* ═══════════ CONTINUE READING (auth) ═══════════ */}
            {continueReading.length > 0 && (
              <FadeUp delay={0.21}>
                <div className="mt-10">
                  <ContinueReadingRail posts={continueReading} />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ TRENDING THIS WEEK ═══════════ */}
            {trending.length > 0 && (
              <FadeUp delay={0.22}>
                <div className="mt-10">
                  <DiscoveryRail
                    title="Trending this week"
                    icon="🔥"
                    posts={trending}
                    badge="Top reads · 7d"
                    variant="trending"
                  />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ SAVED FOR LATER (auth) ═══════════ */}
            {savedForLater.length > 0 && (
              <FadeUp delay={0.23}>
                <div className="mt-10">
                  <SavedForLaterRail posts={savedForLater} />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ SHOWCASE GRID ═══════════ */}
            {showcasePosts.length > 0 && (
              <ul className="mt-12 grid list-none gap-6 sm:grid-cols-2">
                {showcasePosts.map((post, i) => (
                  <li key={post._id}>
                    <FadeUp delay={0.08 * i} className="stagger-enter">
                      <article
                        className="blog-card group relative flex h-full flex-col rounded-2xl"
                        style={{ borderRadius: "1rem", overflow: "hidden" }}
                      >
                        <Link
                          href={`/blog/${post.slug.current}`}
                          aria-label={post.title}
                          className="absolute inset-0 z-0"
                        />
                        <div className="absolute right-3.5 top-3.5 z-20 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                          <SavePostButton postSlug={post.slug.current} iconOnly />
                        </div>
                        <div
                          className="img-shine relative aspect-[16/10] w-full overflow-hidden rounded-t-2xl"
                          style={{
                            borderTopLeftRadius: "1rem",
                            borderTopRightRadius: "1rem",
                          }}
                        >
                          {post.featuredImage?.asset ? (
                            <Image
                              src={urlFor(post.featuredImage)
                                .width(800)
                                .height(500)
                                .quality(80)
                                .url()}
                              alt={post.featuredImage.alt || post.title}
                              fill
                              sizes="(max-width: 640px) 100vw, 50vw"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 via-surface to-accent-2/10">
                              <svg
                                className="h-14 w-14 text-accent/20"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={0.8}
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface to-transparent" />
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
                                <svg
                                  className="h-2.5 w-2.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {post.readingTime} min
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-5 sm:p-6">
                          {post.categories && post.categories.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {post.categories.slice(0, 2).map((cat) => (
                                <span
                                  key={cat.slug.current}
                                  className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent"
                                >
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
                                      src={urlFor(post.author.image)
                                        .width(28)
                                        .height(28)
                                        .url()}
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
                                  <span className="text-xs font-medium text-muted-foreground">
                                    {post.author.name}
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.publishedAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </article>
                    </FadeUp>
                  </li>
                ))}
              </ul>
            )}

            {/* ═══════════ INLINE NEWSLETTER ═══════════ */}
            {isHomeState && (
              <FadeUp delay={0.1}>
                <div className="mt-12">
                  <InlineNewsletterCard />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ EDITOR'S PICK ═══════════ */}
            {editorPicks.length > 0 && (
              <FadeUp delay={0.12}>
                <div className="mt-12">
                  <DiscoveryRail
                    title="Editor's pick"
                    icon="⭐"
                    posts={editorPicks}
                    badge="Curated"
                    variant="picks"
                  />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ EDITORIAL LIST ═══════════ */}
            {editorialPosts.length > 0 && (
              <div className="mt-16">
                <FadeUp delay={0.1}>
                  <div className="mb-10 flex items-center gap-5">
                    <div className="section-divider w-16" />
                    <h2 className="whitespace-nowrap text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      More articles
                    </h2>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </FadeUp>

                <ul className="list-none space-y-3">
                  {editorialPosts.map((post, i) => (
                    <li key={post._id}>
                      <FadeUp delay={0.04 * i}>
                        <article className="editorial-item group relative flex items-center gap-5 overflow-hidden rounded-xl border border-border bg-surface/50 p-4 sm:gap-6 sm:p-5">
                          <Link
                            href={`/blog/${post.slug.current}`}
                            aria-label={post.title}
                            className="absolute inset-0 z-0"
                          />
                          <span className="gradient-number hidden shrink-0 text-4xl font-black leading-none sm:block">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="img-shine relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-[72px] sm:w-[72px]">
                            {post.featuredImage?.asset ? (
                              <Image
                                src={urlFor(post.featuredImage)
                                  .width(160)
                                  .height(160)
                                  .quality(75)
                                  .url()}
                                alt={post.featuredImage.alt || post.title}
                                fill
                                sizes="80px"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10 rounded-xl">
                                <svg
                                  className="h-6 w-6 text-accent/30"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1}
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {post.categories &&
                                post.categories.length > 0 && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                                    {post.categories[0]?.title}
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
                              <p className="text-xs text-muted line-clamp-1">
                                {post.excerpt}
                              </p>
                            )}
                          </div>
                          <div className="hidden shrink-0 flex-col items-end gap-1.5 text-xs text-muted-foreground sm:flex">
                            <span className="font-medium">
                              {new Date(post.publishedAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {post.readingTime && (
                              <span className="flex items-center gap-1 text-accent/60">
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  aria-hidden
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {post.readingTime} min
                              </span>
                            )}
                          </div>
                          <div
                            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-all group-hover:border-accent group-hover:bg-accent/10 sm:flex"
                            aria-hidden
                          >
                            <svg
                              className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.25 4.5l7.5 7.5-7.5 7.5"
                              />
                            </svg>
                          </div>
                          <div className="relative z-10 hidden opacity-0 transition group-hover:opacity-100 focus-within:opacity-100 sm:block">
                            <SavePostButton
                              postSlug={post.slug.current}
                              iconOnly
                            />
                          </div>
                        </article>
                      </FadeUp>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ═══════════ RECENTLY UPDATED ═══════════ */}
            {recentlyUpdated.length > 0 && (
              <FadeUp delay={0.08}>
                <div className="mt-16">
                  <DiscoveryRail
                    title="Refreshed this fortnight"
                    icon="✨"
                    posts={recentlyUpdated}
                    badge="Evergreen"
                    variant="updated"
                  />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ TOPIC SPOTLIGHT ═══════════ */}
            {isHomeState && categories.length > 0 && (
              <FadeUp delay={0.06}>
                <div className="mt-16">
                  <TopicSpotlight categories={categories} />
                </div>
              </FadeUp>
            )}

            {/* ═══════════ AUTHOR SPOTLIGHT ═══════════ */}
            {featuredAuthors.length > 0 && (
              <FadeUp delay={0.04}>
                <div className="mt-12">
                  <AuthorSpotlight authors={featuredAuthors} />
                </div>
              </FadeUp>
            )}
          </>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-16 flex items-center justify-center gap-1.5"
          >
            {page > 1 && (
              <Link
                href={pageHref(page - 1)}
                rel="prev"
                className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Previous
              </Link>
            )}

            <ol className="flex list-none items-center gap-1 px-2">
              {pageWindow.map((item, idx) =>
                item === "..." ? (
                  <li
                    key={`ellipsis-${idx}`}
                    className="flex h-10 w-10 items-center justify-center text-sm text-muted-foreground"
                    aria-hidden
                  >
                    &hellip;
                  </li>
                ) : (
                  <li key={item}>
                    <Link
                      href={pageHref(item)}
                      aria-current={item === page ? "page" : undefined}
                      aria-label={`Go to page ${item}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition ${
                        item === page
                          ? "bg-gradient-to-r from-accent to-accent-2 text-[#0f172a] shadow-lg shadow-accent/20"
                          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      }`}
                    >
                      {item}
                    </Link>
                  </li>
                ),
              )}
            </ol>

            {page < totalPages && (
              <Link
                href={pageHref(page + 1)}
                rel="next"
                className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-accent"
              >
                Next
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            )}
          </nav>
        )}
      </section>
    </div>
  );
}
