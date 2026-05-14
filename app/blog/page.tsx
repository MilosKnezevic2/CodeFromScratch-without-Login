import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getPostsAdvanced,
  getCategoriesWithCounts,
  getTagsWithCategory,
} from "@/lib/sanity/queries";
import { getBlogHeroStats } from "@/lib/sanity/hero-stats";
import { getEditorPicks } from "@/lib/sanity/discovery";
import { urlFor } from "@/lib/sanity/image";
import BlogToolbar from "@/components/blog/BlogToolbar";
import BlogBreadcrumb from "@/components/blog/BlogBreadcrumb";
import ActiveFilterChips, {
  type FilterChip,
} from "@/components/blog/ActiveFilterChips";
import DiscoveryRail from "@/components/blog/DiscoveryRail";
import InlineNewsletterCard from "@/components/blog/InlineNewsletterCard";
import SavePostButton from "@/components/blog/SavePostButton";
import CategoryRail from "@/components/blog/CategoryRail";
import CommandPalette from "@/components/blog/CommandPalette";
import BackToTop from "@/components/blog/BackToTop";
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
  const LIMIT = 12;

  const isHomeState =
    page === 1 && !activeCategory && !activeTag && !searchQuery;

  const [result, categories, allTags, heroStats, editorPicks] =
    await Promise.all([
      getPostsAdvanced({
        page,
        limit: LIMIT,
        sort: activeSort,
        ...(activeCategory ? { category: activeCategory } : {}),
        ...(activeTag ? { tag: activeTag } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
      }),
      getCategoriesWithCounts(),
      getTagsWithCategory(),
      getBlogHeroStats(),
      isHomeState ? getEditorPicks(3) : Promise.resolve([]),
    ]);

  const { posts, pages: totalPages } = result;

  const activeCatObj = activeCategory
    ? categories.find((c) => c.slug.current === activeCategory)
    : null;
  const activeTagObj = activeTag
    ? allTags.find((t) => t.slug.current === activeTag)
    : null;

  const isFiltered = !!(activeCategory || activeTag || searchQuery);
  const showFeatured = page === 1 && !isFiltered && posts.length > 0;
  const featured = showFeatured ? posts[0] : null;
  const articles = showFeatured ? posts.slice(1) : posts;

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

  // Active filter chips shown above the list when a filter is in play.
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
      <BackToTop />

      <main
        id="latest"
        className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8"
      >
        <div className="pt-10">
          {isFiltered && (
            <div className="mb-4">
              <BlogBreadcrumb items={breadcrumbItems} />
            </div>
          )}
          {categories.length > 0 && (
            <CategoryRail
              categories={categories}
              activeCategory={activeCategory}
              buildHref={buildHref}
              totalPosts={heroStats.totalPosts}
            />
          )}
          <BlogToolbar
            initialSearch={searchQuery}
            activeSort={activeSort}
            preserveQuery={{
              ...(activeCategory ? { category: activeCategory } : {}),
              ...(activeTag ? { tag: activeTag } : {}),
              ...(activeSort !== "newest" ? { sort: activeSort } : {}),
            }}
          />
          {filterChips.length > 0 && (
            <div className="mt-5">
              <ActiveFilterChips chips={filterChips} clearHref="/blog" />
            </div>
          )}
        </div>

        {posts.length === 0 ? (
          <div className="mt-32 border-t border-border pt-12 text-center">
            <p className="editorial-display mx-auto max-w-md text-3xl text-muted-foreground">
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
            {/* Cover story — only on the home state (page 1, no filters). */}
            {featured && (
              <article className="group relative mt-20 cursor-pointer">
                <Link
                  href={`/blog/${featured.slug.current}`}
                  aria-label={featured.title}
                  className="absolute inset-0 z-[1]"
                />
                <div className="border-t border-border pt-6">
                  <div className="flex items-baseline gap-4 pb-10">
                    <span className="editorial-meta">Cover story</span>
                    <span className="editorial-meta ml-auto">
                      {formatDate(featured.publishedAt)}
                    </span>
                  </div>
                  <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
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
                        <p className="mt-8 max-w-xl text-xl leading-relaxed text-muted line-clamp-3">
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="mt-10 flex items-center gap-6 text-sm">
                        {featured.author && (
                          <span className="text-foreground">
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
                    <div className="relative aspect-[5/4] overflow-hidden lg:col-span-5">
                      {featured.featuredImage?.asset ? (
                        <Image
                          src={urlFor(featured.featuredImage)
                            .width(900)
                            .height(720)
                            .quality(90)
                            .url()}
                          alt={featured.featuredImage.alt || featured.title}
                          fill
                          sizes="(max-width: 1024px) 100vw, 41vw"
                          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-2">
                          <span
                            aria-hidden
                            className="editorial-rank text-9xl text-accent/30"
                          >
                            ✦
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="absolute right-3 top-12 z-10 sm:top-14">
                  <SavePostButton postSlug={featured.slug.current} iconOnly />
                </div>
              </article>
            )}

            {/* Article list — thumbnail-right rows, the primary content surface. */}
            {articles.length > 0 && (
              <section className="mt-32 border-t border-border pt-6">
                <header className="mb-10 flex flex-wrap items-baseline gap-4">
                  <h2
                    className="editorial-display text-3xl text-foreground sm:text-4xl"
                    style={{ fontStyle: "normal" }}
                  >
                    {showFeatured ? "Latest" : "Articles"}
                  </h2>
                  <span className="editorial-meta ml-auto">
                    {articles.length}{" "}
                    {articles.length === 1 ? "entry" : "entries"}
                  </span>
                </header>

                <ol className="border-b border-border">
                  {articles.map((post) => (
                    <li key={post._id} className="border-t border-border">
                      <article className="group relative cursor-pointer">
                        <Link
                          href={`/blog/${post.slug.current}`}
                          aria-label={post.title}
                          className="absolute inset-0 z-[1]"
                        />
                        <div className="grid grid-cols-[1fr_6rem] items-start gap-4 py-7 sm:grid-cols-[5rem_1fr_10rem] sm:gap-7 lg:grid-cols-[6rem_1fr_13rem] lg:gap-8">
                          <time
                            dateTime={post.publishedAt}
                            className="editorial-meta hidden tabular-nums pt-1 sm:block"
                          >
                            {formatDateShort(post.publishedAt)}
                          </time>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                              {post.categories?.[0] && (
                                <p className="editorial-meta text-foreground">
                                  {post.categories[0].title}
                                  {post.isPremium ? " · Premium" : ""}
                                </p>
                              )}
                              <time
                                dateTime={post.publishedAt}
                                className="editorial-meta tabular-nums opacity-70 sm:hidden"
                              >
                                {formatDateShort(post.publishedAt)}
                              </time>
                            </div>
                            <h3 className="editorial-title-link mt-2.5 text-lg font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent sm:mt-3 sm:text-2xl lg:text-[1.6rem]">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="mt-2 hidden text-sm leading-relaxed text-muted-foreground line-clamp-2 sm:mt-3 sm:block sm:text-base">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground sm:mt-4">
                              {post.author && (
                                <span className="truncate">
                                  By {post.author.name}
                                </span>
                              )}
                              {post.author && post.readingTime && (
                                <span aria-hidden>·</span>
                              )}
                              {post.readingTime && (
                                <span className="editorial-meta tabular-nums whitespace-nowrap">
                                  {post.readingTime} min
                                </span>
                              )}
                              <span
                                aria-hidden
                                className="ml-auto hidden text-lg text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent sm:inline"
                              >
                                →
                              </span>
                            </div>
                          </div>

                          <div className="relative aspect-[4/3] self-start overflow-hidden">
                            {post.featuredImage?.asset ? (
                              <Image
                                src={urlFor(post.featuredImage)
                                  .width(420)
                                  .height(315)
                                  .quality(82)
                                  .url()}
                                alt={post.featuredImage.alt || post.title}
                                fill
                                sizes="(max-width: 640px) 96px, (max-width: 1024px) 160px, 208px"
                                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-surface-2">
                                <span
                                  aria-hidden
                                  className="editorial-rank text-4xl text-accent/25 sm:text-5xl"
                                >
                                  ◆
                                </span>
                              </div>
                            )}
                            <div className="absolute right-2 top-2 z-10">
                              <SavePostButton
                                postSlug={post.slug.current}
                                iconOnly
                              />
                            </div>
                          </div>
                        </div>
                      </article>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Pagination — primary CTA, placed right after the list so it
                isn't lost beneath the discovery rails. */}
            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-24 border-t border-border pt-10"
              >
                <p className="editorial-meta mb-6 text-center text-muted-foreground tabular-nums">
                  Page {String(page).padStart(2, "0")} of{" "}
                  {String(totalPages).padStart(2, "0")}
                </p>

                <div className="flex items-center justify-center gap-6 sm:gap-10">
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      rel="prev"
                      className="group flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <span
                        aria-hidden
                        className="transition-transform group-hover:-translate-x-1"
                      >
                        ←
                      </span>
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Link>
                  ) : (
                    <span
                      aria-hidden
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/30"
                    >
                      <span>←</span>
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </span>
                  )}

                  <ol className="flex list-none items-center gap-1 sm:gap-2">
                    {pageWindow.map((item, idx) =>
                      item === "..." ? (
                        <li
                          key={`ellipsis-${idx}`}
                          className="px-1 text-sm text-muted-foreground/50 sm:px-2"
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
                            className={`flex h-11 min-w-[2.5rem] items-center justify-center border-b-2 px-1.5 text-base font-bold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-w-[2.75rem] sm:text-lg ${
                              item === page
                                ? "border-foreground text-foreground"
                                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                            }`}
                          >
                            {String(item).padStart(2, "0")}
                          </Link>
                        </li>
                      ),
                    )}
                  </ol>

                  {page < totalPages ? (
                    <Link
                      href={pageHref(page + 1)}
                      rel="next"
                      className="group flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:text-accent"
                    >
                      <span>Next</span>
                      <span
                        aria-hidden
                        className="transition-transform group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  ) : (
                    <span
                      aria-hidden
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/30"
                    >
                      <span>Next</span>
                      <span>→</span>
                    </span>
                  )}
                </div>
              </nav>
            )}

            {/* Editor's picks — single curated discovery rail, only on home. */}
            {editorPicks.length > 0 && (
              <div className="mt-32">
                <DiscoveryRail
                  title="Editor's picks"
                  sectionNumber=""
                  posts={editorPicks}
                  variant="picks"
                />
              </div>
            )}

            {/* Newsletter — at the very end, after the user has read everything. */}
            {isHomeState && (
              <div className="mt-32">
                <InlineNewsletterCard />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
