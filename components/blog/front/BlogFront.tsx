import Link from "next/link";
import BackToTop from "@/components/blog/BackToTop";
import CommandPalette from "@/components/blog/CommandPalette";
import JsonLd from "@/components/seo/JsonLd";
import { AREAS, areaCounts, buildFront, type Area } from "@/lib/blog/front";
import { mostReadSlugs } from "@/lib/blog/most-read";
import { buildSafe } from "@/lib/sanity/build-safe";
import { getCategoriesWithCounts, getFrontPosts } from "@/lib/sanity/queries";
import { blogCollectionJsonLd, itemListJsonLd } from "@/lib/seo";
import { FrontCard, LeadStory, SecondStory, metaLine } from "./FrontCards";
import FrontNewsletter from "./FrontNewsletter";
import TopicsMenu from "./TopicsMenu";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

export const FRONT_TITLE = "Journal";
export const FRONT_DESCRIPTION = "In-depth web development tutorials, from your first page to production: frontend, backend and data, deployment and security.";

/** The masthead shared by the front page and the area pages: title, areas, every topic, search. */
export async function JournalMasthead({ activeArea, heading, intro }: { activeArea: Area | null; heading: string; intro: string }) {
  const [posts, categories] = await Promise.all([buildSafe(getFrontPosts(), []), buildSafe(getCategoriesWithCounts(), [])]);
  const counts = areaCounts(posts);
  const topics = categories.filter((c) => c.postCount > 0).map((c) => ({ title: c.title, slug: c.slug.current, count: c.postCount }));
  const tab = (active: boolean) =>
    `inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 text-sm transition-colors sm:px-2 ${
      active ? "border-accent font-bold text-foreground" : "border-transparent text-muted hover:text-foreground"
    }`;

  return (
    <header className="pt-8 sm:pt-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-5xl font-bold leading-none tracking-tight text-foreground sm:text-6xl">{heading}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">{intro}</p>
        </div>
        <form action="/blog/search" method="get" role="search" className="w-full lg:w-96">
          <label htmlFor="journal-search" className="sr-only">
            Search the tutorials
          </label>
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-surface px-4 focus-within:border-accent/60">
            <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="journal-search"
              name="q"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              minLength={2}
              maxLength={100}
              required
              placeholder={`Search ${posts.length} tutorials`}
              className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">Ctrl K</kbd>
          </div>
        </form>
      </div>

      <nav aria-label="Areas and topics" className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-y border-border">
        <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:gap-5 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <li>
            <Link href="/blog" aria-current={activeArea ? undefined : "page"} className={tab(!activeArea)}>
              All <span className="font-mono text-[11px] text-muted-foreground">{posts.length}</span>
            </Link>
          </li>
          {AREAS.filter((a) => (counts.get(a.slug) ?? 0) > 0).map((a) => (
            <li key={a.slug}>
              <Link href={`/blog/area/${a.slug}`} aria-current={activeArea?.slug === a.slug ? "page" : undefined} className={tab(activeArea?.slug === a.slug)}>
                {a.name} <span className="font-mono text-[11px] text-muted-foreground">{counts.get(a.slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="pb-3 sm:pb-0">
          <TopicsMenu topics={topics} />
        </div>
      </nav>
    </header>
  );
}

/** /blog: a magazine front. Lead story, two more, a section per area, then the most read and the newsletter. */
export default async function BlogFront() {
  const [posts, popularSlugs] = await Promise.all([buildSafe(getFrontPosts(), []), mostReadSlugs()]);
  const front = buildFront(posts, popularSlugs);
  const onPage = [front.lead, ...front.second, ...front.sections.flatMap((s) => s.items)].filter((p) => p !== null);

  return (
    <div>
      <JsonLd data={blogCollectionJsonLd({ url: `${SITE_URL}/blog`, name: `${FRONT_TITLE} | CodeFromScratch`, description: FRONT_DESCRIPTION })} />
      {onPage.length > 0 && <JsonLd data={itemListJsonLd(onPage.map((p) => ({ name: p.title, url: `${SITE_URL}/blog/${p.slug}` })))} />}
      <CommandPalette />
      <BackToTop />

      <div className="mx-auto max-w-7xl px-4 pb-28 sm:px-6 lg:px-8">
        <JournalMasthead
          activeArea={null}
          heading="The Journal"
          intro={`Web development, explained until you can ship it. ${posts.length} in-depth tutorials, a new one every week.`}
        />

        {front.lead ? (
          <div className="mt-10 space-y-6">
            <LeadStory post={front.lead} />
            {front.second.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {front.second.map((p) => (
                  <SecondStory key={p._id} post={p} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-12 text-muted">New tutorials are on the way. Check back soon.</p>
        )}

        {front.sections.map((s) => (
          <section key={s.area.slug} aria-labelledby={`area-${s.area.slug}`} className="mt-16 sm:mt-20">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-border pb-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 id={`area-${s.area.slug}`} className="text-2xl font-extrabold tracking-tight text-foreground">
                  {s.area.name}
                </h2>
                <p className="text-sm text-muted">{s.area.why}</p>
              </div>
              <Link href={`/blog/area/${s.area.slug}`} className="text-sm font-bold text-accent hover:underline">
                View all {s.total} →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {s.items.map((p) => (
                <FrontCard key={p._id} post={p} />
              ))}
            </div>
          </section>
        ))}

        <div className="mt-16 grid gap-10 sm:mt-20 lg:grid-cols-2 lg:gap-12">
          {front.popular.length > 0 && (
            <section aria-labelledby="most-read-h">
              <h2 id="most-read-h" className="text-2xl font-extrabold tracking-tight text-foreground">
                Most read
              </h2>
              <ol className="mt-4">
                {front.popular.map((p, i) => (
                  <li key={p._id} className="border-t border-border">
                    <Link href={`/blog/${p.slug}`} className="group flex items-baseline gap-4 py-3.5">
                      <span aria-hidden="true" className="w-5 shrink-0 font-serif text-xl font-bold text-accent">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-bold leading-snug text-foreground group-hover:text-accent">{p.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{[p.category?.title, metaLine(p)].filter(Boolean).join(" · ")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <div className="lg:self-start">
            <FrontNewsletter />
          </div>
        </div>
      </div>
    </div>
  );
}
