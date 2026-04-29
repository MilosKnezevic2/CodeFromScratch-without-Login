import Link from "next/link";
import type { ContinueReadingPost } from "@/lib/sanity/personalisation";

export default function ContinueReadingRail({
  posts,
}: {
  posts: ContinueReadingPost[];
}) {
  if (posts.length === 0) return null;
  return (
    <section aria-label="Continue reading" className="border-t border-border pt-6">
      <header className="mb-10 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§02a</span>
        <h2
          className="editorial-display text-3xl text-foreground sm:text-4xl"
          style={{ fontStyle: "italic" }}
        >
          Where you left off
        </h2>
        <span className="editorial-meta ml-auto text-foreground">For you</span>
      </header>

      <ol className="grid gap-x-12 sm:grid-cols-2">
        {posts.map((post) => {
          const minsLeft =
            post.readingTime !== undefined
              ? Math.max(
                  1,
                  Math.round(
                    (post.readingTime * (100 - post.scrollPercent)) / 100,
                  ),
                )
              : null;
          return (
            <li key={post._id} className="border-t border-border">
              <article className="group relative">
                <Link
                  href={`/blog/${post.slug.current}`}
                  aria-label={`Continue reading: ${post.title}`}
                  className="absolute inset-0 z-0"
                />
                <div className="py-5">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    {post.categories?.[0] && (
                      <p className="editorial-meta text-foreground">
                        {post.categories[0].title}
                      </p>
                    )}
                    <span className="editorial-meta tabular-nums">
                      {post.scrollPercent}% read
                      {minsLeft ? ` · ${minsLeft} min left` : ""}
                    </span>
                  </div>
                  <h3
                    className="editorial-title-link mt-2 text-xl font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent sm:text-2xl"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {post.title}
                  </h3>
                  {/* Hairline progress bar */}
                  <div className="mt-4 h-px w-full overflow-hidden bg-border" aria-hidden>
                    <div
                      className="h-full bg-accent"
                      style={{
                        width: `${Math.max(5, Math.min(95, post.scrollPercent))}%`,
                      }}
                    />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
