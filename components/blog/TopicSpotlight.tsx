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
      <header className="mb-10 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§07</span>
        <h2
          className="editorial-display text-3xl text-foreground sm:text-4xl lg:text-5xl"

        >
          The index
        </h2>
        <span className="editorial-meta ml-auto">
          {categories.length} topics
        </span>
      </header>

      {/* Print-style TOC: 2 columns on desktop, hairline divider per row.
          Title left, count right; clear vertical rhythm instead of a
          dense inline name band. */}
      <ol className="grid gap-x-12 sm:grid-cols-2">
        {visible.map((cat) => (
          <li key={cat._id} className="border-t border-border">
            <Link
              href={`/blog?category=${cat.slug.current}`}
              className="group flex items-baseline justify-between gap-4 py-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span
                className="editorial-title-link text-xl font-bold tracking-tight text-foreground group-hover:text-accent sm:text-2xl"

              >
                {cat.title}
              </span>
              <span className="editorial-meta whitespace-nowrap tabular-nums">
                {String(cat.postCount).padStart(2, "0")}{" "}
                {cat.postCount === 1 ? "article" : "articles"}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
