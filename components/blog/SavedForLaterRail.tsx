import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { SavedForLaterPost } from "@/lib/sanity/personalisation";
import SavePostButton from "./SavePostButton";

export default function SavedForLaterRail({
  posts,
}: {
  posts: SavedForLaterPost[];
}) {
  if (posts.length === 0) return null;
  return (
    <section
      aria-label="Saved for later"
      className="glow-border rounded-2xl border border-border/60 bg-surface/60 p-5 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          <span aria-hidden className="text-base">
            🔖
          </span>
          Saved for later
        </h2>
        <Link
          href="/dashboard/saved"
          className="text-[11px] font-semibold text-accent hover:underline"
        >
          View all →
        </Link>
      </header>

      <ol className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post._id}>
            <article className="group relative h-full rounded-xl border border-border bg-background/60 transition hover:border-accent/40">
              <Link
                href={`/blog/${post.slug.current}`}
                aria-label={post.title}
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
                        🔖
                      </span>
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-bold text-accent backdrop-blur">
                    Saved
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent">
                  {post.title}
                </h3>
                {post.categories?.[0] && (
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-accent">
                    {post.categories[0].title}
                  </p>
                )}
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
