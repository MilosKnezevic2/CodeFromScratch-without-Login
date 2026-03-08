import Link from "next/link";
import type { SuggestedPostsByCategory } from "@/lib/sanity/queries";

export default function SuggestedPosts({
  groups,
}: {
  groups: SuggestedPostsByCategory[];
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        More to read
      </p>
      {groups.map((group) => (
        <div key={group.category.slug.current}>
          <Link
            href={`/blog/category/${group.category.slug.current}`}
            className="mb-2 block text-sm font-semibold text-accent hover:text-accent-2 transition"
          >
            {group.category.title}
          </Link>
          <ul className="space-y-1.5">
            {group.posts.map((post) => (
              <li key={post._id}>
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="block rounded-md px-2 py-1.5 text-[13px] leading-snug text-muted transition hover:bg-surface-2 hover:text-foreground"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
