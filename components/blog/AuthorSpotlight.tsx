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
      className="border-y border-border py-10"
    >
      <header className="mb-8 flex items-baseline gap-4">
        <span className="editorial-meta">§08</span>
        <h2 className="editorial-meta text-foreground">
          Contributors this quarter
        </h2>
      </header>

      <ul className="grid list-none gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {authors.map((author) => {
          const href = author.slug
            ? `/authors/${author.slug.current}`
            : `/blog`;
          return (
            <li key={author._id}>
              <Link
                href={href}
                className="group flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {author.image?.asset ? (
                  <Image
                    src={urlFor(author.image).width(120).height(120).url()}
                    alt={author.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border text-base font-bold"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {author.name.charAt(0)}
                  </span>
                )}
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className="editorial-title-link truncate text-lg font-bold text-foreground group-hover:text-accent"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {author.name}
                  </span>
                  <span className="editorial-meta">
                    {author.postCount}{" "}
                    {author.postCount === 1 ? "article" : "articles"}
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
