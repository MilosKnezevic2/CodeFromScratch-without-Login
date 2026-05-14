import Link from "next/link";
import type { CategoryWithCount } from "@/lib/sanity/queries";
import TopicBrowserDialog from "./TopicBrowserDialog";

type BuildHref = (overrides: Partial<Record<string, string | null>>) => string;

/**
 * Primary topic navigation for /blog. Editorial section-rail aesthetic:
 * "Topics" label + inline list of categories with counts, active state
 * shown as a 2px foreground underline so the current section reads at a
 * glance. The active category is pinned into view if it would otherwise
 * fall outside the visible window. Overflow scrolls horizontally on
 * narrow viewports with the scrollbar hidden.
 */
export default function CategoryRail({
  categories,
  activeCategory,
  buildHref,
  totalPosts,
  visibleCount = 8,
}: {
  categories: CategoryWithCount[];
  activeCategory: string;
  buildHref: BuildHref;
  totalPosts: number;
  visibleCount?: number;
}) {
  if (categories.length === 0) return null;

  // Keep the active category visible even if it sits beyond visibleCount.
  const top = categories.slice(0, visibleCount);
  let visible = top;
  if (activeCategory && !top.some((c) => c.slug.current === activeCategory)) {
    const activeCat = categories.find(
      (c) => c.slug.current === activeCategory,
    );
    if (activeCat) {
      visible = [activeCat, ...top.slice(0, visibleCount - 1)];
    }
  }

  const allActive = !activeCategory;

  const itemClass = (active: boolean) =>
    `group inline-flex items-baseline gap-1.5 whitespace-nowrap border-b-2 pb-1 text-[13px] font-bold uppercase tracking-[0.16em] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      active
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  const countClass =
    "text-[10px] font-bold tabular-nums opacity-50 transition-opacity group-hover:opacity-100";

  return (
    <nav aria-label="Browse by topic" className="border-t border-border">
      <div className="flex items-center gap-4 py-4 sm:gap-6">
        <span className="editorial-meta hidden shrink-0 sm:inline">Topics</span>

        {/* Scrollable rail — only the chip list scrolls; the dialog
            trigger sits outside so it is always visible. A right-edge
            gradient hints that more topics exist when the rail overflows. */}
        <div className="relative min-w-0 flex-1">
          <ul className="-mx-4 flex items-center gap-x-6 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <li className="shrink-0">
              <Link
                href={buildHref({ category: null, tag: null, page: null })}
                aria-pressed={allActive}
                className={itemClass(allActive)}
              >
                All
                <span className={countClass}>{totalPosts}</span>
              </Link>
            </li>
            {visible.map((cat) => {
              const active = activeCategory === cat.slug.current;
              return (
                <li key={cat._id} className="shrink-0">
                  <Link
                    href={buildHref({
                      category: cat.slug.current,
                      tag: null,
                      page: null,
                    })}
                    aria-pressed={active}
                    className={itemClass(active)}
                  >
                    {cat.title}
                    <span className={countClass}>{cat.postCount}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"
          />
        </div>

        {/* Trigger — outside the scroll container so it is always pinned
            on the right edge regardless of viewport width. */}
        <div className="shrink-0">
          <TopicBrowserDialog
            categories={categories}
            activeCategory={activeCategory}
            triggerLabel={`All topics · ${categories.length}`}
          />
        </div>
      </div>
    </nav>
  );
}
