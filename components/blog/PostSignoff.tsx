import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";

type Author = {
  name: string;
  bio?: string;
  image?: { asset: { _ref: string } };
};

/**
 * Editorial sign-off shown at the end of an article — humanises
 * the page after the body type ends. Portrait + name + optional
 * location/role line + publish date. Reads like a print-magazine
 * "— BY MILOS, GRAZ, APRIL 2026" footer.
 */
export default function PostSignoff({
  author,
  publishedAt,
  location,
}: {
  author: Author;
  publishedAt: string;
  location?: string;
}) {
  const date = new Date(publishedAt).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
  return (
    <aside className="post-signoff">
      {author.image?.asset ? (
        <Image
          src={urlFor(author.image).width(96).height(96).url()}
          alt={author.name}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-sm font-semibold"
        >
          {author.name.charAt(0)}
        </span>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold text-foreground">
          By {author.name}
        </span>
        <span className="editorial-meta">
          {[location, date].filter(Boolean).join(" · ")}
        </span>
      </div>
    </aside>
  );
}
