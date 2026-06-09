import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { SanityPost } from "@/lib/sanity/queries";
import type { HomeStats } from "@/lib/sanity/home-stats";

const formatNumber = (n: number) =>
  n >= 10_000 ? `${Math.round(n / 100) / 10}k` : n.toLocaleString("en-GB");

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function issueLine(): string {
  const now = new Date();
  const month = now.toLocaleString("en-GB", { month: "long" }).toUpperCase();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7,
  );
  return `Vol. ${now.getFullYear() - 2024} · Issue ${String(week).padStart(2, "0")} · ${month}`;
}

export default function HomeHero({
  featured,
  stats,
}: {
  featured: SanityPost | null;
  stats: HomeStats;
}) {
  const imageUrl = featured?.featuredImage?.asset
    ? urlFor(featured.featuredImage).width(1200).height(900).quality(85).url()
    : null;
  const lastPublished = relativeTime(stats.lastPublishedAt);

  return (
    <section className="border-b border-border/60 bg-background px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Edition rule line */}
        <div className="flex items-center gap-3 border-b border-border/60 py-4">
          <span className="editorial-meta whitespace-nowrap">{issueLine()}</span>
          <span className="editorial-meta ml-auto hidden whitespace-nowrap sm:inline">
            CodeFromScratch / The Journal
          </span>
          <span className="editorial-meta ml-auto whitespace-nowrap sm:hidden">
            The Journal
          </span>
        </div>

        {/* Two-column hero: text left, featured preview right */}
        <div className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-16">
          {/* Left — masthead + standfirst + author + CTA */}
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <h1
                className="editorial-display text-foreground"
                style={{
                  fontSize: "clamp(2.5rem,7vw,5.5rem)",
                  lineHeight: "1.02",
                }}
              >
                A journal for{" "}
                <span style={{ color: "var(--color-accent)" }}>
                  serious web developers.
                </span>
              </h1>
              <p className="post-standfirst mt-8 max-w-xl">
                Tutorials, guides, and deep dives on modern web development —
                shipped from a small studio in Graz, free, with code you can
                read in your own repo.
              </p>
            </div>

            {/* Author intro + CTAs */}
            <div className="mt-10">
              <div className="flex items-center gap-3 border-t border-border/60 pt-6">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-sm font-bold text-foreground"
                >
                  M
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    By Miloš Knežević
                  </p>
                  <p className="editorial-meta">
                    Solo developer · Graz, Austria
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Link
                  href="#newsletter"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Subscribe to the letter
                </Link>
                <Link
                  href="/blog"
                  className="text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:text-accent"
                >
                  Browse the archive →
                </Link>
              </div>
            </div>
          </div>

          {/* Right — featured article preview */}
          {featured && (
            <Link
              href={`/blog/${featured.slug.current}`}
              className="group block lg:col-span-5"
            >
              <p className="editorial-meta mb-3 flex items-center gap-3">
                <span className="text-foreground">Latest issue</span>
                {lastPublished && (
                  <>
                    <span aria-hidden className="text-muted-foreground">/</span>
                    <span>{lastPublished}</span>
                  </>
                )}
              </p>
              {imageUrl ? (
                <div className="relative aspect-[5/4] overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={
                      featured.featuredImage?.alt || featured.title
                    }
                    fill
                    sizes="(max-width: 1024px) 100vw, 41vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                    priority
                  />
                </div>
              ) : (
                <div className="flex aspect-[5/4] items-center justify-center bg-surface-2">
                  <span aria-hidden className="text-6xl text-accent/30">✦</span>
                </div>
              )}
              <h2
                className="editorial-display mt-6 text-foreground transition-colors group-hover:text-accent"
                style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)" }}
              >
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="editorial-body mt-3 text-muted line-clamp-2">
                  {featured.excerpt}
                </p>
              )}
              <p className="mt-4 flex items-center gap-3 text-sm">
                {featured.author && (
                  <span className="font-semibold text-foreground">
                    By {featured.author.name}
                  </span>
                )}
                {featured.readingTime && (
                  <>
                    <span aria-hidden className="text-muted-foreground">·</span>
                    <span className="editorial-meta">
                      {featured.readingTime} min read
                    </span>
                  </>
                )}
              </p>
            </Link>
          )}
        </div>

        {/* Stats band */}
        <div className="flex flex-wrap items-baseline justify-between gap-y-3 border-t border-border/60 py-4">
          <dl className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
            {[
              {
                label: "Articles",
                value:
                  stats.totalPosts > 0
                    ? formatNumber(stats.totalPosts)
                    : "—",
              },
              {
                label: "Reads · 30 d",
                value:
                  stats.readsLast30d > 0
                    ? formatNumber(stats.readsLast30d)
                    : "—",
              },
              {
                label: "Subscribers",
                value:
                  stats.subscribers > 0
                    ? formatNumber(stats.subscribers)
                    : "—",
              },
              {
                label: "Years writing",
                value:
                  stats.yearsActive > 0 ? String(stats.yearsActive) : "—",
              },
            ].map((tile, i) => (
              <div key={tile.label} className="flex items-baseline gap-2">
                <dt className="editorial-meta">
                  {String(i + 1).padStart(2, "0")} · {tile.label}
                </dt>
                <dd className="text-base font-extrabold tabular-nums text-foreground">
                  {tile.value}
                </dd>
              </div>
            ))}
          </dl>
          <span className="editorial-meta">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
        </div>
      </div>
    </section>
  );
}
