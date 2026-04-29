import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import ViewCounter from "./ViewCounter";

type Author = {
  name: string;
  bio?: string;
  image?: { asset: { _ref: string } };
};

type Category = {
  title: string;
  slug: { current: string };
};

/**
 * Editorial masthead for /blog/[slug]. Replaces the legacy
 * "centered title under a glowing image card" with a magazine
 * layout: edition rule line, category + date, oversized display
 * headline, standfirst paragraph, hairline byline row.
 */
export default function BlogPostMasthead({
  title,
  excerpt,
  categories,
  author,
  publishedAt,
  readingMinutes,
  isPremium,
  slug,
}: {
  title: string;
  excerpt?: string;
  categories?: Category[];
  author?: Author;
  publishedAt: string;
  readingMinutes: number;
  isPremium?: boolean;
  slug: string;
}) {
  const dateLabel = new Date(publishedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const dateTagLine = new Date(publishedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
  const primaryCategory = categories?.[0];

  return (
    <header className="border-b border-border/60 pb-10 sm:pb-14">
      {/* Edition rule line */}
      <div className="mb-10 flex flex-wrap items-center gap-3 border-t border-border/60 py-3 sm:mb-14">
        {primaryCategory && (
          <Link
            href={`/blog/category/${primaryCategory.slug.current}`}
            className="editorial-meta text-foreground transition-colors hover:text-accent"
          >
            {primaryCategory.title}
          </Link>
        )}
        <span aria-hidden className="editorial-meta text-muted-foreground">
          /
        </span>
        <time dateTime={publishedAt} className="editorial-meta">
          {dateTagLine}
        </time>
        {isPremium && (
          <span className="editorial-meta ml-2 rounded-full border border-accent/40 px-2 py-0.5 text-accent">
            Premium
          </span>
        )}
        <span className="editorial-meta ml-auto">
          {readingMinutes} min read
        </span>
      </div>

      {/* Display headline */}
      <h1
        className="editorial-display text-foreground"
        style={{
          fontSize: "clamp(2.25rem,6vw,5rem)",
          lineHeight: "1.04",
        }}
      >
        {title}
      </h1>

      {/* Standfirst */}
      {excerpt && (
        <p className="post-standfirst mt-6 max-w-3xl">
          {excerpt}
        </p>
      )}

      {/* Byline row */}
      {author && (
        <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-border/60 pt-6">
          {author.image?.asset ? (
            <Image
              src={urlFor(author.image).width(96).height(96).url()}
              alt={author.name}
              width={48}
              height={48}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 text-base font-semibold text-foreground"
            >
              {author.name.charAt(0)}
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-base font-semibold text-foreground">
              By {author.name}
            </span>
            <span className="editorial-meta">
              {dateLabel}
            </span>
          </div>
          <span className="editorial-meta">
            <ViewCounter slug={slug} />
          </span>
        </div>
      )}
    </header>
  );
}
