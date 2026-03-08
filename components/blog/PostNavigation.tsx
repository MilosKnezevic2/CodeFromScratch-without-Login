import Link from "next/link";
import type { AdjacentPost } from "@/lib/sanity/queries";

export default function PostNavigation({
  prev,
  next,
}: {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}) {
  if (!prev && !next) return null;

  return (
    <nav className="mt-10 grid gap-4 sm:grid-cols-2">
      {prev ? (
        <Link
          href={`/blog/${prev.slug.current}`}
          className="group rounded-xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-accent/30"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Previous
          </span>
          <p className="mt-1.5 text-sm font-medium text-foreground transition group-hover:text-accent">
            {prev.title}
          </p>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/blog/${next.slug.current}`}
          className="group rounded-xl border border-border bg-surface p-5 text-right transition hover:-translate-y-0.5 hover:border-accent/30"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Next
          </span>
          <p className="mt-1.5 text-sm font-medium text-foreground transition group-hover:text-accent">
            {next.title}
          </p>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
