import Link from "next/link";
import type { CategoryWithCount } from "@/lib/sanity/queries";

export default function TopicSpotlight({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  if (categories.length === 0) return null;
  const visible = categories.slice(0, 12);
  return (
    <section
      aria-label="Browse topics"
      className="border-t border-border pt-10"
    >
      <header className="mb-8 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§07</span>
        <h2
          className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl"
          style={{ fontStyle: "italic" }}
        >
          The index
        </h2>
        <span className="editorial-meta ml-auto">
          {categories.length} topics
        </span>
      </header>

      <ul
        className="flex flex-wrap items-baseline gap-x-6 gap-y-3"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {visible.map((cat, i) => (
          <li key={cat._id} className="flex items-baseline gap-2">
            <Link
              href={`/blog?category=${cat.slug.current}`}
              className="editorial-title-link text-2xl font-bold uppercase tracking-tight text-foreground transition-colors hover:text-accent sm:text-3xl"
              style={{ fontStyle: "normal" }}
            >
              {cat.title}
            </Link>
            <sup className="editorial-meta tabular-nums">
              ({cat.postCount})
            </sup>
            {i < visible.length - 1 && (
              <span aria-hidden className="text-muted-foreground">
                ·
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
