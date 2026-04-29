import type { BlogHeroStats } from "@/lib/sanity/hero-stats";
import FadeUp from "@/components/animations/FadeUp";

const formatNumber = (n: number) =>
  n >= 10_000 ? `${Math.round(n / 100) / 10}k` : n.toLocaleString("en-GB");

function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

export default function BlogHero({ stats }: { stats: BlogHeroStats }) {
  const lastPublished = relativeTime(stats.lastPublishedAt);
  const lastUpdated = relativeTime(stats.lastUpdatedAt);
  const tiles: Array<{ value: string; label: string; tone?: "accent" }> = [
    {
      value: stats.totalPosts > 0 ? formatNumber(stats.totalPosts) : "—",
      label: "articles",
      tone: "accent",
    },
    ...(lastPublished
      ? [{ value: lastPublished, label: "last published" }]
      : []),
    ...(stats.readsLast30d > 0
      ? [
          {
            value: formatNumber(stats.readsLast30d),
            label: "reads · 30 days",
          },
        ]
      : []),
    ...(lastUpdated && lastUpdated !== lastPublished
      ? [{ value: lastUpdated, label: "last refreshed" }]
      : []),
  ];

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-surface/30 px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl text-center">
        <FadeUp>
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            <span aria-hidden className="h-px w-6 bg-accent" />
            CodeFromScratch
            <span aria-hidden className="h-px w-6 bg-accent" />
          </p>
        </FadeUp>
        <FadeUp delay={0.05}>
          <h1
            className="mt-4 text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Tutorials, guides &amp;{" "}
            <span className="gradient-text">deep dives</span>
          </h1>
        </FadeUp>
        <FadeUp delay={0.1}>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Practical web-development articles to sharpen your skills and
            ship real-world projects.
          </p>
        </FadeUp>
        {tiles.length > 0 && (
          <FadeUp delay={0.15}>
            <dl className="mx-auto mt-8 flex flex-wrap items-end justify-center gap-x-8 gap-y-3 text-left">
              {tiles.map((tile) => (
                <div key={tile.label}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {tile.label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-xl font-extrabold tabular-nums ${
                      tile.tone === "accent"
                        ? "text-accent"
                        : "text-foreground"
                    }`}
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {tile.value}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeUp>
        )}
      </div>
    </section>
  );
}
