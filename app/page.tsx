import type { Metadata } from "next";
import Link from "next/link";
import {
  getPostsAdvanced,
} from "@/lib/sanity/queries";
import { buildSafe } from "@/lib/sanity/build-safe";
import { getEditorPicks } from "@/lib/sanity/discovery";
import { getHomeStats } from "@/lib/sanity/home-stats";
import HomeHero from "@/components/home/HomeHero";
import HomeStartHere from "@/components/home/HomeStartHere";
import HomeAuthorLetter from "@/components/home/HomeAuthorLetter";
import MobileSubscribeBar from "@/components/home/MobileSubscribeBar";
import InlineNewsletterCard from "@/components/blog/InlineNewsletterCard";
import JsonLd from "@/components/seo/JsonLd";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const metadata: Metadata = {
  // `absolute` opts out of the root "%s | CodeFromScratch" template — the
  // brand is already in this title, the template would double it.
  title: { absolute: "CodeFromScratch — A journal for serious web developers" },
  description:
    "Tutorials, guides, and deep dives on modern web development. Thoughtful, carefully researched pieces — free, with code you can read in your own repo.",
  alternates: { canonical: SITE_URL },
};

export const revalidate = 60;

export default async function HomePage() {
  /**
   * Home is the brand + conversion surface. The archive (/blog)
   * owns trending, picks, topics, full recent list, search, and
   * filtering — duplicating those rails here was a mistake. What
   * the home page uniquely does:
   *  - Hero with the latest issue (so first contact is real content,
   *    not abstract claims).
   *  - High-priority newsletter capture (letterpress).
   *  - Start-here onboarding (curated reading order for newcomers).
   *  - From-the-editor personal note (humanises a solo journal).
   *  - "Now" block (signals the journal is alive).
   * Everything else points at /blog.
   */
  // getHomeStats/getEditorPicks degrade internally; the posts read is
  // build-safe so a Sanity outage during deploy can't fail the build.
  const [latestResult, stats, editorPicks] = await Promise.all([
    buildSafe(getPostsAdvanced({ page: 1, limit: 1, sort: "newest" }), {
      posts: [],
      total: 0,
      pages: 0,
    }),
    getHomeStats(),
    getEditorPicks(5),
  ]);

  const featured = latestResult.posts[0] ?? null;
  // Start-here: editor picks if curated, otherwise no rail.
  const startHere = editorPicks.length >= 3 ? editorPicks.slice(0, 5) : [];

  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "CodeFromScratch",
          url: SITE_URL,
          description:
            "A journal for serious web developers. Tutorials, guides, and deep dives on modern web development.",
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
        {/* Newsletter — high-priority capture */}
        <div id="newsletter" className="mt-20 scroll-mt-24">
          <InlineNewsletterCard />
        </div>

        {/* Start here — onboarding for new readers */}
        {startHere.length > 0 && (
          <div className="mt-24">
            <HomeStartHere posts={startHere} />
          </div>
        )}

        {/* From the editor — personal note */}
        <div className="mt-24">
          <HomeAuthorLetter />
        </div>

        {/* Browse the archive — handoff to /blog */}
        <section className="mt-24 border-y border-border py-16 text-center">
          <p className="editorial-meta">§ The archive</p>
          <h2
            className="editorial-display mt-4 text-foreground"
            style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}
          >
            Every issue, indexed.
          </h2>
          <p className="post-standfirst mx-auto mt-5 max-w-xl">
            Trending, editor&rsquo;s picks, topics, and the full back catalogue
            live in the journal archive — searchable, filterable, with a
            command-key palette for power readers.
          </p>
          <Link
            href="/blog"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
          >
            Browse the journal →
          </Link>
        </section>
      </main>

      <MobileSubscribeBar />
    </div>
  );
}
