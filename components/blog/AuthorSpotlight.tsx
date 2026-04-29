import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import type { AuthorWithPostCount } from "@/lib/sanity/queries";

export default function AuthorSpotlight({
  authors,
}: {
  authors: AuthorWithPostCount[];
}) {
  if (authors.length === 0) return null;
  return (
    <section
      aria-label="Featured authors"
      className="rounded-2xl border border-border/60 bg-surface/40 p-5 sm:p-6"
    >
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-foreground">
          <span aria-hidden className="text-base">
            ✍️
          </span>
          Featured authors
        </h2>
      </header>

      <ul className="grid list-none gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => {
          const href = author.slug
            ? `/authors/${author.slug.current}`
            : `/blog`;
          return (
            <li key={author._id}>
              <Link
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3 transition hover:border-accent/40 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {author.image?.asset ? (
                  <Image
                    src={urlFor(author.image).width(96).height(96).url()}
                    alt={author.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-accent/20"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-base font-bold text-accent"
                  >
                    {author.name.charAt(0)}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-bold text-foreground group-hover:text-accent">
                    {author.name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {author.postCount}{" "}
                    {author.postCount === 1 ? "article" : "articles"}
                    {author.bio ? ` · ${author.bio.slice(0, 60)}…` : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
