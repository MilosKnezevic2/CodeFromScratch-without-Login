import type { BlogHeroStats } from "@/lib/sanity/hero-stats";

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

function issueLine(): string {
  const now = new Date();
  const month = now.toLocaleString("en-GB", { month: "long" }).toUpperCase();
  const year = now.getFullYear();
  // ISO week number — gives a print-magazine "Issue 17" feel
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - start.getTime()) / 86_400_000 + start.getDay() + 1) / 7,
  );
  return `Vol. ${year - 2024} · Issue ${String(week).padStart(2, "0")} · ${month} ${year}`;
}

export default function BlogHero({ stats }: { stats: BlogHeroStats }) {
  const lastPublished = relativeTime(stats.lastPublishedAt);
  const tiles: Array<{ value: string; label: string }> = [
    {
      value: stats.totalPosts > 0 ? formatNumber(stats.totalPosts) : "—",
      label: "Articles",
    },
    ...(lastPublished
      ? [{ value: lastPublished, label: "Latest issue" }]
      : []),
    ...(stats.readsLast30d > 0
      ? [
          {
            value: formatNumber(stats.readsLast30d),
            label: "Reads · 30 d",
          },
        ]
      : []),
  ];

  return (
    <section className="editorial-grain relative border-b border-border/80 bg-background px-4 sm:px-6 lg:px-8">
      <div className="relative z-[1] mx-auto max-w-7xl">
        {/* Top edition rule */}
        <div className="flex items-center gap-3 border-b border-border/60 py-4">
          <span className="editorial-meta">{issueLine()}</span>
          <span aria-hidden className="ml-auto editorial-meta">
            CodeFromScratch / The Journal
          </span>
        </div>

        {/* Asymmetric masthead — left=display title, right=descriptor */}
        <div className="grid gap-8 py-14 sm:py-20 lg:grid-cols-12 lg:gap-12">
          <h1 className="editorial-display text-foreground sm:col-span-12 lg:col-span-8 lg:text-[clamp(4rem,9vw,9rem)]">
            <span className="block text-[clamp(3rem,12vw,6.5rem)] sm:text-[clamp(4rem,10vw,9rem)]">
              Tutorials,
            </span>
            <span
              className="block text-[clamp(3rem,12vw,6.5rem)] sm:text-[clamp(4rem,10vw,9rem)]"
              style={{ fontStyle: "italic", color: "var(--color-accent)" }}
            >
              guides &amp;
            </span>
            <span className="block text-[clamp(3rem,12vw,6.5rem)] sm:text-[clamp(4rem,10vw,9rem)]">
              deep dives.
            </span>
          </h1>

          <div className="self-end sm:col-span-12 lg:col-span-4">
            <p
              className="text-base leading-relaxed text-muted sm:text-lg"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              <em>
                A weekly journal of practical web-development writing —
                shipped from a small studio in Graz to readers across the
                world. No newsletters about newsletters. No 12-step listicles.
                Just craft.
              </em>
            </p>
            <a
              href="#latest"
              className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground hover:text-accent"
            >
              Read this issue
              <span aria-hidden>↓</span>
            </a>
          </div>
        </div>

        {/* Bottom stats band */}
        {tiles.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-y-4 border-t border-border/60 py-4">
            <dl className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
              {tiles.map((tile, i) => (
                <div
                  key={tile.label}
                  className="flex items-baseline gap-2"
                >
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
        )}
      </div>
    </section>
  );
}
