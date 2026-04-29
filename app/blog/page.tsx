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
import PaletteTrigger from "@/components/blog/PaletteTrigger";
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

const PAGE_TITLE = "Journal";
const PAGE_DESCRIPTION =
  "Tutorials, guides, and deep dives — a weekly journal of practical web-development writing.";

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
    // allTags is still queried so the active-tag chip can show the
    // human title even though the inline tag dropdown was retired in
    // this redesign in favour of the topic index at the bottom.
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

  const isFiltered = !!(
    activeCategory ||
    activeTag ||
    searchQuery ||
    readingTimeFilter ||
    difficultyFilter
  );
  const showFeatured = page === 1 && !isFiltered && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const gridPosts = showFeatured ? posts.slice(1) : posts;
  /** Asymmetric magazine spread: 1 large + 2 stacked = 3 visual slots. */
  const showcasePosts = gridPosts.slice(0, 3);
  const editorialPosts = gridPosts.slice(3);

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
    filterChips.push({
      label: "Category",
      value: activeCatObj.title,
      removeHref: buildHref({ category: null, page: null }),
      tone: "category",
    });
  }
  if (activeTagObj) {
    filterChips.push({
      label: "Tag",
      value: activeTagObj.title,
      removeHref: buildHref({ tag: null, page: null }),
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
    const labelMap = { short: "Short", medium: "Standard", long: "Long-form" };
    filterChips.push({
      label: "Length",
      value: labelMap[readingTimeFilter],
      removeHref: buildHref({ readingTime: null, page: null }),
      tone: "sort",
    });
  }
  if (difficultyFilter) {
    filterChips.push({
      label: "Level",
      value:
        difficultyFilter.charAt(0).toUpperCase() + difficultyFilter.slice(1),
      removeHref: buildHref({ difficulty: null, page: null }),
      tone: "sort",
    });
  }

  // Breadcrumbs
  const breadcrumbItems: { label: string; href?: string }[] = [
    { label: "Home", href: "/" },
    { label: "Journal", href: isFiltered ? "/blog" : undefined },
  ];
  if (activeCatObj) {
    breadcrumbItems.push({
      label: activeCatObj.title,
      href: activeTagObj ? `/blog?category=${activeCategory}` : undefined,
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
    activeCatObj?.title ?? activeTagObj?.title ?? "Journal";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const formatDateShort = (iso: string) =>
    new Date(iso)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
      .toUpperCase();

  return (
    <div>
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
              .filter(
                (b) =>
                  b.href || b === breadcrumbItems[breadcrumbItems.length - 1],
              )
              .map((b) => ({
                name: b.label,
                url: `${SITE_URL}${b.href ?? pageHref(1)}`,
              })),
          )}
        />
      )}
      {page > 1 && (
        <link rel="prev" href={`${SITE_URL}${pageHref(page - 1)}`} />
      )}
      {page < totalPages && (
        <link rel="next" href={`${SITE_URL}${pageHref(page + 1)}`} />
      )}

      <CommandPalette />
      <BlogHero stats={heroStats} />

      <main
        id="latest"
        className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8"
      >
        {/* Toolbar + breadcrumb. Consolidated into a single block:
            row 1 = search + sort + palette trigger;
            row 2 = inline chip filters · hide-read · active chips.
            The legacy CategoryFilter dropdown was retired in favour
            of the topic index at §07 + the ⌘K palette. */}
        <div className="pt-10">
          {isFiltered && (
            <div className="mb-4">
              <BlogBreadcrumb items={breadcrumbItems} />
            </div>
          )}
          <div className="flex items-center gap-4">
            <div className="flex-1">
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
            <PaletteTrigger className="hidden lg:inline-flex" />
          </div>

          {(filterChips.length > 0 ||
            userId ||
            readingTimeFilter ||
            difficultyFilter) && (
            <div className="mt-5 flex flex-wrap items-baseline gap-x-10 gap-y-3">
              <ChipFilters
                value={{
                  readingTime: readingTimeFilter ?? "",
                  difficulty: difficultyFilter ?? "",
                }}
                buildHref={buildHref}
              />
              {userId && (
                <HideReadToggle
                  active={hideReadActive}
                  toggleHref={hideReadHref()}
                />
              )}
              {filterChips.length > 0 && (
                <ActiveFilterChips chips={filterChips} clearHref="/blog" />
              )}
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="mt-32 border-t border-border pt-12 text-center">
            <p
              className="editorial-display mx-auto max-w-md text-3xl text-muted-foreground"
    
            >
              {searchQuery
                ? `Nothing matches "${searchQuery}".`
                : "No articles found."}
            </p>
            {isFiltered && (
              <Link
                href="/blog"
                className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.2em] text-foreground underline-offset-4 hover:text-accent hover:underline"
              >
                Clear filters & start over →
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ═══════════ §01 — FEATURED COVER ═══════════ */}
            {featured && (
              <article className="group relative mt-20 cursor-pointer">
                <Link
                  href={`/blog/${featured.slug.current}`}
                  aria-label={featured.title}
                  className="absolute inset-0 z-[1]"
                />
                <div className="border-t border-border pt-6">
                  <div className="flex items-baseline gap-4 pb-10">
                    <span className="editorial-meta">§01 · Cover story</span>
                    <span className="editorial-meta ml-auto">
                      {formatDate(featured.publishedAt)}
                    </span>
                  </div>
                  <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
                    {/* Display title — left */}
                    <div className="lg:col-span-7">
                      {featured.categories?.[0] && (
                        <p className="editorial-meta mb-6 text-foreground">
                          {featured.categories[0].title}
                          {featured.isPremium ? " · Premium" : ""}
                        </p>
                      )}
                      <h2
                        className="editorial-display text-foreground transition-colors group-hover:text-accent"
                        style={{
                          fontStyle: "normal",
                          fontSize: "clamp(2rem,5.5vw,4.5rem)",
                        }}
                      >
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p
                          className="mt-8 max-w-xl text-xl leading-relaxed text-muted line-clamp-3"

                        >
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="mt-10 flex items-center gap-6 text-sm">
                        {featured.author && (
                          <span
                            className="text-foreground"

                          >
                            By {featured.author.name}
                          </span>
                        )}
                        {featured.readingTime && (
                          <span className="editorial-meta">
                            {featured.readingTime} min read
                          </span>
                        )}
                        <span className="editorial-title-link ml-auto text-xs font-bold uppercase tracking-[0.2em] text-foreground">
                          Read the article →
                        </span>
                      </div>
                    </div>
                    {/* Image — right column, save button is hoisted to
                        article level below so its click area is not
                        intercepted by the stretched-link. */}
                    <div className="relative aspect-[5/4] overflow-hidden lg:col-span-5">
                      {featured.featuredImage?.asset ? (
                        <Image
                          src={urlFor(featured.featuredImage)
                            .width(900)
                            .height(720)
                            .quality(90)
                            .url()}
                          alt={
                            featured.featuredImage.alt || featured.title
                          }
                          fill
                          sizes="(max-width: 1024px) 100vw, 41vw"
                          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-2">
                          <span aria-hidden className="editorial-rank text-9xl text-accent/30">
                            ✦
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute right-3 top-12 z-10 sm:top-14">
                  <SavePostButton
                    postSlug={featured.slug.current}
                    iconOnly
                  />
                </div>
              </article>
            )}

            {/* ═══════════ §02 — TRENDING (auth or anon) ═══════════ */}
            {continueReading.length > 0 && (
              <div className="mt-32">
                <ContinueReadingRail posts={continueReading} />
              </div>
            )}
            {trending.length > 0 && (
              <div className="mt-32">
                <DiscoveryRail
                  title="The charts"
                  sectionNumber="02"
                  posts={trending}
                  variant="trending"
                />
              </div>
            )}

            {/* ═══════════ §03 — ASYMMETRIC SHOWCASE ═══════════ */}
            {showcasePosts.length > 0 && (
              <section className="mt-32 border-t border-border pt-6">
                <header className="mb-10 flex flex-wrap items-baseline gap-4">
                  <span className="editorial-meta">§03</span>
                  <h2
                    className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl"
          
                  >
                    The spread
                  </h2>
                </header>
                <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
                  {/* Hero card — large, left, 7 cols */}
                  {showcasePosts[0] && (
                    <article className="group relative lg:col-span-7 cursor-pointer">
                      <Link
                        href={`/blog/${showcasePosts[0].slug.current}`}
                        aria-label={showcasePosts[0].title}
                        className="absolute inset-0 z-[1]"
                      />
                      <div className="relative aspect-[4/3] overflow-hidden">
                        {showcasePosts[0].featuredImage?.asset ? (
                          <Image
                            src={urlFor(showcasePosts[0].featuredImage)
                              .width(900)
                              .height(675)
                              .quality(85)
                              .url()}
                            alt={
                              showcasePosts[0].featuredImage.alt ||
                              showcasePosts[0].title
                            }
                            fill
                            sizes="(max-width: 1024px) 100vw, 58vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-2">
                            <span
                              aria-hidden
                              className="editorial-rank text-9xl text-accent/20"
                            >
                              ✶
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-6">
                        {showcasePosts[0].categories?.[0] && (
                          <p className="editorial-meta mb-3 text-foreground">
                            {showcasePosts[0].categories[0].title}
                          </p>
                        )}
                        <h3
                          className="editorial-display text-foreground transition-colors group-hover:text-accent"
                          style={{
                            fontStyle: "normal",
                            fontSize: "clamp(1.75rem,3.2vw,2.75rem)",
                          }}
                        >
                          {showcasePosts[0].title}
                        </h3>
                        {showcasePosts[0].excerpt && (
                          <p
                            className="mt-4 text-base leading-relaxed text-muted line-clamp-2"

                          >
                            {showcasePosts[0].excerpt}
                          </p>
                        )}
                        <div className="mt-5 flex items-center gap-4 text-sm">
                          {showcasePosts[0].author && (
                            <span
                              className="text-foreground"

                            >
                              By {showcasePosts[0].author.name}
                            </span>
                          )}
                          <span className="editorial-meta">
                            {formatDate(showcasePosts[0].publishedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="absolute right-2 top-2 z-10">
                        <SavePostButton
                          postSlug={showcasePosts[0].slug.current}
                          iconOnly
                        />
                      </div>
                    </article>
                  )}

                  {/* Stack — right, 5 cols, two posts */}
                  <div className="space-y-12 lg:col-span-5">
                    {showcasePosts.slice(1, 3).map((post) => (
                      <article key={post._id} className="group relative cursor-pointer">
                        <Link
                          href={`/blog/${post.slug.current}`}
                          aria-label={post.title}
                          className="absolute inset-0 z-[1]"
                        />
                        <div className="relative aspect-[5/3] overflow-hidden">
                          {post.featuredImage?.asset ? (
                            <Image
                              src={urlFor(post.featuredImage)
                                .width(640)
                                .height(384)
                                .quality(82)
                                .url()}
                              alt={post.featuredImage.alt || post.title}
                              fill
                              sizes="(max-width: 1024px) 100vw, 41vw"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-surface-2">
                              <span
                                aria-hidden
                                className="editorial-rank text-7xl text-accent/20"
                              >
                                ◆
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute right-3 top-3 z-10">
                          <SavePostButton
                            postSlug={post.slug.current}
                            iconOnly
                          />
                        </div>
                        <div className="mt-4">
                          {post.categories?.[0] && (
                            <p className="editorial-meta mb-2 text-foreground">
                              {post.categories[0].title}
                            </p>
                          )}
                          <h3
                            className="editorial-display text-2xl leading-tight text-foreground transition-colors group-hover:text-accent sm:text-3xl"
                            style={{ fontStyle: "normal" }}
                          >
                            {post.title}
                          </h3>
                          {post.author && (
                            <p
                              className="mt-3 text-xs text-muted-foreground"

                            >
                              By {post.author.name}
                            </p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ═══════════ §04 — SAVED FOR LATER ═══════════ */}
            {savedForLater.length > 0 && (
              <div className="mt-32">
                <SavedForLaterRail posts={savedForLater} />
              </div>
            )}

            {/* ═══════════ §05 — NEWSLETTER LETTERPRESS ═══════════ */}
            {isHomeState && (
              <div className="mt-32">
                <InlineNewsletterCard />
              </div>
            )}

            {/* ═══════════ §06 — EDITOR'S PICKS PULL QUOTES ═══════════ */}
            {editorPicks.length > 0 && (
              <div className="mt-32">
                <DiscoveryRail
                  title="Editor's desk"
                  sectionNumber="06"
                  posts={editorPicks}
                  variant="picks"
                />
              </div>
            )}

            {/* ═══════════ §07 — EDITORIAL INDEX (date+title rows) ═══════════ */}
            {editorialPosts.length > 0 && (
              <section className="mt-32 border-t border-border pt-6">
                <header className="mb-10 flex flex-wrap items-baseline gap-4">
                  <span className="editorial-meta">§{isHomeState ? "07" : "01"}</span>
                  <h2
                    className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl"
          
                  >
                    {isHomeState ? "From the archive" : "Articles"}
                  </h2>
                  <span className="editorial-meta ml-auto">
                    {editorialPosts.length}{" "}
                    {editorialPosts.length === 1 ? "entry" : "entries"}
                  </span>
                </header>

                <ol className="border-b border-border">
                  {editorialPosts.map((post) => (
                    <li key={post._id} className="border-t border-border">
                      <article className="group relative cursor-pointer">
                        <Link
                          href={`/blog/${post.slug.current}`}
                          aria-label={post.title}
                          className="absolute inset-0 z-[1]"
                        />
                        <div className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-6 py-6 sm:grid-cols-[6.5rem_1fr_auto]">
                          <time
                            dateTime={post.publishedAt}
                            className="editorial-meta tabular-nums"
                          >
                            {formatDateShort(post.publishedAt)}
                          </time>
                          <div className="min-w-0">
                            {post.categories?.[0] && (
                              <p className="editorial-meta mb-1.5 text-foreground">
                                {post.categories[0].title}
                                {post.isPremium ? " · Premium" : ""}
                              </p>
                            )}
                            <h3
                              className="editorial-title-link text-xl font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent sm:text-2xl"

                            >
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
                                {post.excerpt}
                              </p>
                            )}
                            {post.author && (
                              <p
                                className="mt-2 text-xs text-muted-foreground"

                              >
                                By {post.author.name}
                                {post.readingTime &&
                                  ` · ${post.readingTime} min read`}
                              </p>
                            )}
                          </div>
                          <span className="flex shrink-0 items-center gap-3 self-center">
                            <span className="relative z-10">
                              <SavePostButton
                                postSlug={post.slug.current}
                                iconOnly
                              />
                            </span>
                            <span
                              aria-hidden
                              className="hidden text-2xl text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent sm:inline"
                            >
                              →
                            </span>
                          </span>
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* ═══════════ §08 — REFRESHED ═══════════ */}
            {recentlyUpdated.length > 0 && (
              <div className="mt-32">
                <DiscoveryRail
                  title="Refreshed this fortnight"
                  sectionNumber="08"
                  posts={recentlyUpdated}
                  variant="updated"
                />
              </div>
            )}

            {/* ═══════════ §09 — TOPIC INDEX ═══════════ */}
            {isHomeState && categories.length > 0 && (
              <div className="mt-32">
                <TopicSpotlight categories={categories} />
              </div>
            )}

            {/* ═══════════ §10 — MASTHEAD AUTHORS ═══════════ */}
            {featuredAuthors.length > 0 && (
              <div className="mt-32">
                <AuthorSpotlight authors={featuredAuthors} />
              </div>
            )}
          </>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-32 flex items-center justify-center gap-6 border-t border-border pt-10"
          >
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                rel="prev"
                className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
              >
                ← Prev
              </Link>
            ) : (
              <span aria-hidden className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                ← Prev
              </span>
            )}

            <ol className="flex list-none items-center gap-2">
              {pageWindow.map((item, idx) =>
                item === "..." ? (
                  <li
                    key={`ellipsis-${idx}`}
                    className="px-2 text-sm text-muted-foreground"
                    aria-hidden
                  >
                    …
                  </li>
                ) : (
                  <li key={item}>
                    <Link
                      href={pageHref(item)}
                      aria-current={item === page ? "page" : undefined}
                      aria-label={`Page ${item}`}
                      className={`editorial-rank px-2 text-2xl tabular-nums transition ${
                        item === page
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item}
                    </Link>
                  </li>
                ),
              )}
            </ol>

            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                rel="next"
                className="text-xs font-bold uppercase tracking-[0.2em] text-foreground hover:text-accent"
              >
                Next →
              </Link>
            ) : (
              <span aria-hidden className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                Next →
              </span>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
