import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { ContinueReadingPost } from "@/lib/sanity/personalisation";
import SavePostButton from "./SavePostButton";

export default function ContinueReadingRail({
  posts,
}: {
  posts: ContinueReadingPost[];
}) {
  if (posts.length === 0) return null;
  return (
    <section
      aria-label="Continue reading"
      className="glow-border rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 via-surface to-accent-2/5 p-5 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          <span aria-hidden className="text-base">
            ⏯
          </span>
          Continue reading
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            For you
          </span>
        </h2>
      </header>

      <ol className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post._id}>
            <article className="group relative h-full rounded-xl border border-border bg-background/60 transition hover:border-accent/40">
              <Link
                href={`/blog/${post.slug.current}`}
                aria-label={`Continue reading: ${post.title}`}
                className="absolute inset-0 z-0"
              />
              <div className="relative z-[1] p-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-lg">
                  {post.featuredImage?.asset ? (
                    <Image
                      src={urlFor(post.featuredImage)
                        .width(480)
                        .height(300)
                        .quality(75)
                        .url()}
                      alt={post.featuredImage.alt || post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 240px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10">
                      <span aria-hidden className="text-2xl opacity-30">
                        ⏯
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent">
                  {post.title}
                </h3>

                {/* Reading progress */}
                <div className="mt-3" aria-hidden>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-2 transition-all"
                      style={{
                        width: `${Math.max(5, Math.min(95, post.scrollPercent))}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-bold tabular-nums text-foreground">
                      {post.scrollPercent}%
                    </span>
                    {post.readingTime && (
                      <span>
                        ~{Math.max(
                          1,
                          Math.round(
                            (post.readingTime *
                              (100 - post.scrollPercent)) /
                              100,
                          ),
                        )}{" "}
                        min left
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="absolute right-2 top-2 z-10 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <SavePostButton postSlug={post.slug.current} iconOnly />
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
