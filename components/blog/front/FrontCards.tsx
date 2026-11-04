import Image from "next/image";
import Link from "next/link";
import SavePostButton from "@/components/blog/SavePostButton";
import { urlFor } from "@/lib/sanity/image";
import type { FrontPostCard } from "@/lib/sanity/queries";

const dateLabel = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

export function metaLine(post: FrontPostCard): string {
  return [dateLabel(post.publishedAt), post.readingTime ? `${post.readingTime} min` : null].filter(Boolean).join(" · ");
}

/** The article cover; covers carry the title in type, so the image is decorative next to the real title. */
export function FrontCover({ post, sizes, priority = false, className = "" }: { post: FrontPostCard; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={`relative aspect-[1200/630] overflow-hidden bg-surface-2 ${className}`}>
      {post.featuredImage?.asset && (
        <Image
          src={urlFor(post.featuredImage).width(1200).quality(80).url()}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

function Eyebrow({ post, prefix }: { post: FrontPostCard; prefix?: string }) {
  if (!post.category && !prefix) return null;
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
      {[prefix, post.category?.title].filter(Boolean).join(" · ")}
    </p>
  );
}

/** Every card's frame: its own surface and border, lifted on hover, so cards read as separate objects on the page. */
const CARD =
  "group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xl focus-within:border-accent/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/** The bottom row of a card: date and reading time on the left, Save in the bottom-right corner. */
function CardFooter({ post, byline = false }: { post: FrontPostCard; byline?: boolean }) {
  return (
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-2">
      <p className="text-xs text-muted-foreground">{byline ? `Milos Knezevic · ${metaLine(post)}` : metaLine(post)}</p>
      {/* Above the card's stretched link, so a tap saves instead of opening the article. */}
      <div className="relative z-10 -mb-1 -mr-2">
        <SavePostButton postSlug={post.slug} iconOnly />
      </div>
    </div>
  );
}

/** The lead story: text beside a large cover, the whole card one link. */
export function LeadStory({ post }: { post: FrontPostCard }) {
  return (
    <article className={`${CARD} grid rounded-3xl lg:grid-cols-12`}>
      <div className="order-2 flex flex-col gap-4 p-6 sm:p-10 lg:order-1 lg:col-span-5 lg:justify-center">
        <Eyebrow post={post} prefix="New" />
        <h2 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-4xl sm:leading-[1.1]">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="text-base leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>}
        <div className="mt-2">
          <CardFooter post={post} byline />
        </div>
      </div>
      <div className="order-1 border-b border-border lg:order-2 lg:col-span-7 lg:border-b-0 lg:border-l">
        <FrontCover post={post} sizes="(min-width: 1024px) 700px, 100vw" priority className="lg:aspect-auto lg:h-full lg:min-h-80" />
      </div>
    </article>
  );
}

/**
 * A card for the grids: cover across the top from tablet width up; on a
 * phone a compact row (text, small cover on the right) so a section is not
 * a wall of full-width pictures. The footer row carries Save on the right.
 */
export function FrontCard({ post, showExcerpt = false }: { post: FrontPostCard; showExcerpt?: boolean }) {
  return (
    <article className={`${CARD} grid h-full grid-cols-[minmax(0,1fr)_7rem] sm:flex sm:flex-col`}>
      <div className="col-start-2 row-start-1 m-4 ml-0 sm:order-first sm:m-0 sm:border-b sm:border-border">
        <FrontCover post={post} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 7rem" className="rounded-lg sm:rounded-none" />
      </div>
      <div className="col-start-1 row-start-1 flex flex-col gap-2 p-4 pr-0 sm:p-5 sm:pb-3">
        <Eyebrow post={post} />
        <h3 className="text-base font-extrabold leading-snug text-foreground sm:text-lg">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {post.title}
          </Link>
        </h3>
        {showExcerpt && post.excerpt && <p className="hidden text-sm leading-relaxed text-muted line-clamp-2 sm:block">{post.excerpt}</p>}
      </div>
      <div className="col-span-2 flex flex-1 flex-col px-4 pb-2 sm:px-5">
        <CardFooter post={post} />
      </div>
    </article>
  );
}

/** The two stories after the lead: cover beside the text from tablet width up, a compact row on a phone. */
export function SecondStory({ post }: { post: FrontPostCard }) {
  return (
    <article className={`${CARD} grid h-full grid-cols-[minmax(0,1fr)_7rem] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`}>
      <div className="col-start-2 row-start-1 m-4 ml-0 sm:col-start-1 sm:row-span-2 sm:m-0 sm:border-r sm:border-border">
        <FrontCover post={post} sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 7rem" className="rounded-lg sm:aspect-auto sm:h-full sm:min-h-36 sm:rounded-none" />
      </div>
      <div className="col-start-1 row-start-1 flex flex-col gap-2 p-4 pr-0 sm:col-start-2 sm:p-5 sm:pb-2">
        <Eyebrow post={post} />
        <h3 className="text-base font-extrabold leading-snug text-foreground sm:text-lg">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {post.title}
          </Link>
        </h3>
      </div>
      <div className="col-span-2 flex flex-col px-4 pb-2 sm:col-span-1 sm:col-start-2 sm:px-5">
        <CardFooter post={post} />
      </div>
    </article>
  );
}
