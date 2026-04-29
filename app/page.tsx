import type { Metadata } from "next";
import Link from "next/link";
import {
  getPostsAdvanced,
  getCategoriesWithCounts,
} from "@/lib/sanity/queries";
import {
  getTrendingPosts,
  getEditorPicks,
} from "@/lib/sanity/discovery";
import { getHomeStats } from "@/lib/sanity/home-stats";
import HomeHero from "@/components/home/HomeHero";
import HomeStartHere from "@/components/home/HomeStartHere";
import HomeAuthorLetter from "@/components/home/HomeAuthorLetter";
import HomeNowBlock from "@/components/home/HomeNowBlock";
import MobileSubscribeBar from "@/components/home/MobileSubscribeBar";
import DiscoveryRail from "@/components/blog/DiscoveryRail";
import TopicSpotlight from "@/components/blog/TopicSpotlight";
import InlineNewsletterCard from "@/components/blog/InlineNewsletterCard";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  title: "CodeFromScratch — A weekly journal for serious web developers",
  description:
    "Tutorials, guides, and deep dives on modern web development. One thoughtful piece a week, free, with code you can read in your own repo.",
  alternates: { canonical: SITE_URL },
};

export const revalidate = 60;

export default async function HomePage() {
  const [
    latestResult,
    categories,
    stats,
    trending,
    editorPicks,
  ] = await Promise.all([
    getPostsAdvanced({ page: 1, limit: 8, sort: "newest" }),
    getCategoriesWithCounts(),
    getHomeStats(),
    getTrendingPosts(7, 5),
    getEditorPicks(5),
  ]);

  const latest = latestResult.posts;
  const featured = latest[0] ?? null;
  const recentRest = latest.slice(1, 5);
  // Start-here uses editor picks if available, otherwise top of latest.
  const startHere = editorPicks.length >= 3 ? editorPicks.slice(0, 5) : recentRest.slice(0, 4);

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CodeFromScratch",
          url: SITE_URL,
          description:
            "A weekly journal for serious web developers. Tutorials, guides, and deep dives on modern web development.",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />

      <HomeHero featured={featured} stats={stats} />

      <main className="mx-auto max-w-7xl px-4 pb-32 sm:px-6 lg:px-8">
        {/* §01 Inline newsletter capture — high-value placement */}
        <div id="newsletter" className="mt-20 scroll-mt-24">
          <InlineNewsletterCard />
        </div>

        {/* §02 Start here — onboarding for new readers */}
        {startHere.length > 0 && (
          <div className="mt-24">
            <HomeStartHere posts={startHere} />
          </div>
        )}

        {/* §03 Trending this week */}
        {trending.length > 0 && (
          <div className="mt-24">
            <DiscoveryRail
              title="Trending this week"
              sectionNumber="03"
              posts={trending}
              variant="trending"
            />
          </div>
        )}

        {/* §04 Editor's desk */}
        {editorPicks.length > 0 && (
          <div className="mt-24">
            <DiscoveryRail
              title="Editor's desk"
              sectionNumber="04"
              posts={editorPicks.slice(0, 3)}
              variant="picks"
            />
          </div>
        )}

        {/* §05 Latest articles */}
        {recentRest.length > 0 && (
          <section className="mt-24 border-t border-border pt-6">
            <header className="mb-10 flex flex-wrap items-baseline gap-4">
              <span className="editorial-meta">§05</span>
              <h2 className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl">
                Recent issues
              </h2>
              <Link
                href="/blog"
                className="ml-auto text-xs font-bold uppercase tracking-[0.2em] text-foreground hover:text-accent"
              >
                Browse all →
              </Link>
            </header>
            <ol className="border-b border-border">
              {recentRest.map((post) => (
                <li key={post._id} className="border-t border-border">
                  <Link
                    href={`/blog/${post.slug.current}`}
                    className="group grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-6 py-6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:grid-cols-[6.5rem_1fr_auto]"
                  >
                    <time
                      dateTime={post.publishedAt}
                      className="editorial-meta tabular-nums"
                    >
                      {new Date(post.publishedAt)
                        .toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })
                        .toUpperCase()}
                    </time>
                    <div className="min-w-0">
                      {post.categories?.[0] && (
                        <p className="editorial-meta mb-1.5 text-foreground">
                          {post.categories[0].title}
                        </p>
                      )}
                      <h3 className="editorial-title-link text-xl font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent sm:text-2xl">
                        {post.title}
                      </h3>
                      {post.author && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          By {post.author.name}
                          {post.readingTime &&
                            ` · ${post.readingTime} min read`}
                        </p>
                      )}
                    </div>
                    <span
                      aria-hidden
                      className="hidden text-2xl text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent sm:inline"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* §06 Topics */}
        {categories.length > 0 && (
          <div className="mt-24">
            <TopicSpotlight categories={categories} />
          </div>
        )}

        {/* §07 From the editor */}
        <div className="mt-24">
          <HomeAuthorLetter />
        </div>

        {/* §08 What I'm working on now */}
        <div className="mt-16">
          <HomeNowBlock />
        </div>
      </main>

      <MobileSubscribeBar />
    </div>
  );
}
