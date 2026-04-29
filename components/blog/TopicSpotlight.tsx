import Link from "next/link";
import type { CategoryWithCount } from "@/lib/sanity/queries";

const ICONS = ["✦", "◆", "▲", "●", "■", "◇", "▼", "◢", "◤", "✶"];

export default function TopicSpotlight({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  if (categories.length === 0) return null;
  const visible = categories.slice(0, 8);
  return (
    <section
      aria-label="Browse topics"
      className="rounded-2xl border border-border/60 bg-surface/40 p-5 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          <span aria-hidden className="text-base">
            🧭
          </span>
          Explore by topic
        </h2>
        <p className="text-[11px] text-muted-foreground">
          {categories.length} topics · pick one to focus the feed
        </p>
      </header>

      <ul className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((cat, i) => (
          <li key={cat._id}>
            <Link
              href={`/blog?category=${cat.slug.current}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition hover:border-accent/40 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 via-surface-2 to-accent-2/20 text-xl text-accent"
              >
                {ICONS[i % ICONS.length]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold text-foreground group-hover:text-accent">
                  {cat.title}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {cat.postCount}{" "}
                  {cat.postCount === 1 ? "article" : "articles"}
                </span>
              </span>
              <span
                aria-hidden
                className="text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
