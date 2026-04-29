import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { SavedForLaterPost } from "@/lib/sanity/personalisation";

export default function SavedForLaterRail({
  posts,
}: {
  posts: SavedForLaterPost[];
}) {
  if (posts.length === 0) return null;
  return (
    <section aria-label="Saved for later" className="border-t border-border pt-6">
      <header className="mb-10 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§04</span>
        <h2
          className="editorial-display text-3xl text-foreground sm:text-4xl"
          style={{ fontStyle: "italic" }}
        >
          Bookmarked
        </h2>
        <Link
          href="/dashboard/saved"
          className="ml-auto text-xs font-bold uppercase tracking-[0.2em] text-foreground hover:text-accent"
        >
          View collection →
        </Link>
      </header>

      <ol className="grid gap-x-12 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post._id} className="border-t border-border">
            <article className="group relative">
              <Link
                href={`/blog/${post.slug.current}`}
                aria-label={post.title}
                className="absolute inset-0 z-0"
              />
              <div className="grid grid-cols-[4rem_1fr] gap-4 py-5">
                <div className="relative aspect-square overflow-hidden">
                  {post.featuredImage?.asset ? (
                    <Image
                      src={urlFor(post.featuredImage)
                        .width(128)
                        .height(128)
                        .quality(75)
                        .url()}
                      alt={post.featuredImage.alt || post.title}
                      fill
                      sizes="64px"
                      className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-surface-2">
                      <span aria-hidden className="text-xl opacity-30">
                        ★
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  {post.categories?.[0] && (
                    <p className="editorial-meta text-foreground">
                      {post.categories[0].title}
                    </p>
                  )}
                  <h3
                    className="editorial-title-link mt-1.5 text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent sm:text-lg"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {post.title}
                  </h3>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
