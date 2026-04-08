import Link from "next/link";
import type { SidebarSuggestionGroup } from "@/lib/sanity/queries";

export default function SmartSuggestions({
  groups,
}: {
  groups: SidebarSuggestionGroup[];
}) {
  if (groups.length === 0) return null;

  return (
    <div>
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Recommended
      </p>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.category}>
            <p className="mb-2 text-[11px] font-semibold text-accent">
              {group.category}
            </p>
            <ul className="space-y-1">
              {group.posts.map((post) => (
                <li key={post._id}>
                  <Link
                    href={`/blog/${post.slug.current}`}
                    className="group block rounded-md px-2 py-1.5 transition hover:bg-surface-2"
                  >
                    <p className="text-[13px] leading-snug text-muted transition group-hover:text-foreground">
                      {post.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
