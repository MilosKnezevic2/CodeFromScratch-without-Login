import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/lib/sanity/image";
import type { ReadingPick } from "@/lib/blog/keep-reading";

/** One article to read next: cover, the reason it is here, title, excerpt, reading time. */
export default function ReadingCard({ post, sizes }: { post: ReadingPick; sizes: string }) {
  const minutes = typeof post.readingTime === "number" && post.readingTime > 0 ? post.readingTime : null;
  return (
    <Link
      href={`/blog/${post.slug.current}`}
      className="blog-card group flex h-full flex-col rounded-2xl"
      style={{ borderRadius: "1rem", overflow: "hidden" }}
    >
      <div className="img-shine relative aspect-[1200/630] w-full overflow-hidden">
        {post.featuredImage?.asset ? (
          <Image
            src={urlFor(post.featuredImage).width(800).quality(80).url()}
            // The title below is the link's text; the cover only repeats it.
            alt=""
            fill
            sizes={sizes}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 via-surface to-accent-2/10" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-accent">{post.reason}</p>
        <h3 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-accent line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{post.excerpt}</p>}
        {minutes && <p className="mt-auto pt-2 font-mono text-[11px] text-muted-foreground">{minutes} min read</p>}
      </div>
    </Link>
  );
}
