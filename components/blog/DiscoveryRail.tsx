import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { DiscoveryPost } from "@/lib/sanity/discovery";
import SavePostButton from "./SavePostButton";

const formatNumber = (n: number) =>
  n >= 10_000 ? `${Math.round(n / 100) / 10}k` : n.toLocaleString("en-GB");

function relativeDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export default function DiscoveryRail({
  title,
  sectionNumber,
  posts,
  variant = "trending",
}: {
  title: string;
  sectionNumber: string;
  posts: DiscoveryPost[];
  /** Legacy props kept for back-compat; both no-op in this version. */
  icon?: string;
  badge?: string;
  variant?: "trending" | "picks" | "updated";
}) {
  if (posts.length === 0) return null;

  return (
    <section aria-label={title} className="relative">
      <header className="mb-10 flex flex-wrap items-baseline gap-4 border-t border-border pt-6">
        {sectionNumber && (
          <span className="editorial-meta">§{sectionNumber}</span>
        )}
        <h2 className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </header>

      {variant === "trending" && <TrendingChart posts={posts} />}
      {variant === "picks" && <EditorPicks posts={posts} />}
      {variant === "updated" && <RefreshedRail posts={posts} />}
    </section>
  );
}

/* ────────────── Trending — Billboard-style chart, no images ──────────────
   Big rank digit on the left, title + meta in the middle, view count
   on the right. Looks like the front-of-book chart spread of a print
   magazine. */
function TrendingChart({ posts }: { posts: DiscoveryPost[] }) {
  const top = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      {/* Hero chart cover — #1 with massive rank */}
      {top && (
        <article className="group relative lg:col-span-7 cursor-pointer">
          <Link
            href={`/blog/${top.slug.current}`}
            aria-label={top.title}
            className="absolute inset-0 z-[1]"
          />
          <div className="relative grid grid-cols-[auto_1fr] gap-6 border-l-4 border-accent pl-6 sm:gap-8">
            <span className="editorial-rank text-[6rem] leading-none text-accent sm:text-[7rem] lg:text-[8rem]">
              1
            </span>
            <div className="flex flex-col justify-end pb-2">
              {top.categories?.[0] && (
                <p className="editorial-meta mb-3">
                  {top.categories[0].title}
                </p>
              )}
              <h3 className="editorial-display text-3xl leading-[0.95] text-foreground transition-colors group-hover:text-accent sm:text-4xl lg:text-5xl">
                {top.title}
              </h3>
              {top.excerpt && (
                <p className="editorial-body mt-4 max-w-md text-base text-muted line-clamp-2">
                  {top.excerpt}
                </p>
              )}
              <p className="mt-5 flex items-center gap-3 text-xs text-muted-foreground">
                {top.author && (
                  <span className="font-bold uppercase tracking-wider text-foreground">
                    By {top.author.name}
                  </span>
                )}
                {top.viewCount !== undefined && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {formatNumber(top.viewCount)} reads this week
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="absolute right-0 top-0 z-10">
            <SavePostButton postSlug={top.slug.current} iconOnly />
          </div>
        </article>
      )}

      {/* Ranks 2–N as a tight vertical list */}
      {rest.length > 0 && (
        <ol className="lg:col-span-5">
          {rest.map((post, i) => (
            <li
              key={post._id}
              className="border-b border-border last:border-b-0"
            >
              <article className="group relative cursor-pointer">
                <Link
                  href={`/blog/${post.slug.current}`}
                  aria-label={post.title}
                  className="absolute inset-0 z-[1]"
                />
                <div className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-4 py-4">
                  <span className="editorial-rank text-3xl text-muted-foreground">
                    {i + 2}
                  </span>
                  <div className="min-w-0">
                    {post.categories?.[0] && (
                      <p className="editorial-meta mb-1 text-[10px]">
                        {post.categories[0].title}
                      </p>
                    )}
                    <h3 className="editorial-title-link text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent">
                      {post.title}
                    </h3>
                  </div>
                  {post.viewCount !== undefined && (
                    <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatNumber(post.viewCount)}
                    </span>
                  )}
                  <span className="relative z-10">
                    <SavePostButton postSlug={post.slug.current} iconOnly />
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/* ────────────── Editor's picks — pull-quote rows, no thumbnails ──────────────
   Each pick is a serif pull quote from the article (excerpt) at large
   display size, with a small byline + read link. Reads like the
   "Editor's Letter" page of a print magazine. */
function EditorPicks({ posts }: { posts: DiscoveryPost[] }) {
  return (
    <ol>
      {posts.map((post, i) => (
        <li
          key={post._id}
          className={`border-t border-border ${i === posts.length - 1 ? "border-b" : ""}`}
        >
          <article className="group relative cursor-pointer">
            <Link
              href={`/blog/${post.slug.current}`}
              aria-label={post.title}
              className="absolute inset-0 z-[1]"
            />
            <div className="grid items-end gap-6 py-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-2">
                <p className="editorial-meta">
                  Pick {String(i + 1).padStart(2, "0")}
                </p>
                {post.categories?.[0] && (
                  <p className="editorial-meta mt-1 text-foreground">
                    {post.categories[0].title}
                  </p>
                )}
              </div>
              <div className="lg:col-span-10">
                <p className="editorial-display text-2xl leading-[1.05] text-foreground transition-colors group-hover:text-accent sm:text-3xl lg:text-4xl">
                  &ldquo;{post.excerpt ?? post.title}&rdquo;
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {post.author && (
                    <span className="font-semibold text-foreground">
                      — {post.author.name}
                    </span>
                  )}
                  <span aria-hidden>·</span>
                  <span className="editorial-title-link font-bold uppercase tracking-[0.2em]">
                    Read the article →
                  </span>
                  <span className="relative z-10 ml-auto">
                    <SavePostButton postSlug={post.slug.current} iconOnly />
                  </span>
                </div>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

/* ────────────── Refreshed — side-by-side pairs, hairline stack ──────────────
   Smaller posts surfacing for evergreen rediscovery. Two columns of
   minimalist rows with thumbnail + title + "refreshed" timestamp. */
function RefreshedRail({ posts }: { posts: DiscoveryPost[] }) {
  return (
    <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {posts.map((post) => (
        <li key={post._id} className="border-t border-border pt-5">
          <article className="group relative cursor-pointer">
            <Link
              href={`/blog/${post.slug.current}`}
              aria-label={post.title}
              className="absolute inset-0 z-[1]"
            />
            <div className="grid grid-cols-[5rem_1fr_auto] items-start gap-4">
              <div className="relative aspect-square overflow-hidden">
                {post.featuredImage?.asset ? (
                  <Image
                    src={urlFor(post.featuredImage)
                      .width(160)
                      .height(160)
                      .quality(75)
                      .url()}
                    alt={post.featuredImage.alt || post.title}
                    fill
                    sizes="80px"
                    className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-2">
                    <span aria-hidden className="text-2xl opacity-30">
                      ✦
                    </span>
                  </div>
                )}
              </div>
              <div>
                <p className="editorial-meta">
                  Refreshed {relativeDate(post.updatedAt)}
                </p>
                <h3 className="editorial-title-link mt-2 text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent">
                  {post.title}
                </h3>
                {post.author && (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    By {post.author.name}
                  </p>
                )}
              </div>
              <span className="relative z-10">
                <SavePostButton postSlug={post.slug.current} iconOnly />
              </span>
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
