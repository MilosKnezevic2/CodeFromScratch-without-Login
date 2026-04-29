import Link from "next/link";
import type { DiscoveryPost } from "@/lib/sanity/discovery";

/**
 * Onboarding path for first-time visitors. A numbered list of
 * curated posts presented like a print "Editor's recommended
 * reading order". Falls back to the editor-pick rail when no
 * dedicated start-here field exists in the CMS.
 */
export default function HomeStartHere({
  posts,
}: {
  posts: DiscoveryPost[];
}) {
  if (posts.length === 0) return null;
  return (
    <section
      aria-label="Start here"
      className="border-t border-border pt-6"
    >
      <header className="mb-10 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§02</span>
        <h2 className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl">
          Start here
        </h2>
        <span className="editorial-meta ml-auto">
          New readers · {posts.length} essential reads
        </span>
      </header>

      <ol className="border-y border-border">
        {posts.map((post, i) => (
          <li key={post._id} className="border-t border-border first:border-t-0">
            <Link
              href={`/blog/${post.slug.current}`}
              className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-6 py-6 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className="editorial-rank text-3xl text-muted-foreground tabular-nums group-hover:text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                {post.categories?.[0] && (
                  <p className="editorial-meta mb-1.5 text-foreground">
                    {post.categories[0].title}
                  </p>
                )}
                <h3 className="editorial-title-link text-xl font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent sm:text-2xl">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-1">
                    {post.excerpt}
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
  );
}
