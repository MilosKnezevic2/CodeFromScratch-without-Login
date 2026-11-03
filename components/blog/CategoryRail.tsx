import type { CategoryWithCount } from "@/lib/sanity/queries";
import TopicChips from "./TopicChips";

type BuildHref = (overrides: Partial<Record<string, string | null>>) => string;

/**
 * Topic navigation for /blog: every topic with articles, busiest first, as
 * wrapping chips (TopicChips). Topics without articles are left out; the
 * active one always shows, moved to the front so it is never hidden behind
 * "more". Links are built here, on the server, so the client part only
 * receives plain data.
 */
export default function CategoryRail({
  categories,
  activeCategory,
  buildHref,
  totalPosts,
}: {
  categories: CategoryWithCount[];
  activeCategory: string;
  buildHref: BuildHref;
  totalPosts: number;
}) {
  const withPosts = categories.filter((c) => c.postCount > 0 || c.slug.current === activeCategory);
  if (withPosts.length === 0) return null;
  const active = withPosts.find((c) => c.slug.current === activeCategory);
  const ordered = active ? [active, ...withPosts.filter((c) => c !== active)] : withPosts;

  return (
    <TopicChips
      all={{ id: "all", title: "All", count: totalPosts, href: buildHref({ category: null, tag: null, page: null }), active: !activeCategory }}
      topics={ordered.map((c) => ({
        id: c._id,
        title: c.title,
        count: c.postCount,
        href: buildHref({ category: c.slug.current, tag: null, page: null }),
        active: c.slug.current === activeCategory,
      }))}
    />
  );
}
