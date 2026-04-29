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
  icon,
  posts,
  badge,
  variant = "trending",
}: {
  title: string;
  icon: string;
  posts: DiscoveryPost[];
  badge?: string;
  variant?: "trending" | "picks" | "updated";
}) {
  if (posts.length === 0) return null;
  return (
    <section
      aria-label={title}
      className="glow-border rounded-2xl border border-border/60 bg-surface/50 p-5 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          <span aria-hidden className="text-base">
            {icon}
          </span>
          {title}
          {badge && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              {badge}
            </span>
          )}
        </h2>
      </header>

      <ol className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {posts.map((post, i) => (
          <li key={post._id}>
            <article className="group relative h-full rounded-xl border border-border bg-background/60 transition hover:border-accent/40 hover:bg-surface">
              <Link
                href={`/blog/${post.slug.current}`}
                className="block h-full p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
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
                        {icon}
                      </span>
                    </div>
                  )}
                  {variant === "trending" && (
                    <span className="absolute left-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-foreground backdrop-blur">
                      #{i + 1}
                    </span>
                  )}
                  {post.isPremium && (
                    <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-accent-foreground">
                      PRO
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-accent">
                  {post.title}
                </h3>
                <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  {variant === "trending" && post.viewCount !== undefined && (
                    <span className="font-bold text-accent">
                      {formatNumber(post.viewCount)} reads
                    </span>
                  )}
                  {variant === "picks" && post.categories?.[0] && (
                    <span className="font-bold uppercase tracking-wider text-accent">
                      {post.categories[0].title}
                    </span>
                  )}
                  {variant === "updated" && post.updatedAt && (
                    <span className="font-bold uppercase tracking-wider text-accent-2">
                      Refreshed {relativeDate(post.updatedAt)}
                    </span>
                  )}
                  {post.readingTime && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{post.readingTime} min</span>
                    </>
                  )}
                </p>
              </Link>
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
