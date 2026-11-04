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

/** The lead story: text beside a large cover, the whole card one link. */
export function LeadStory({ post }: { post: FrontPostCard }) {
  return (
    <article className="group relative grid overflow-hidden rounded-3xl border border-border bg-surface lg:grid-cols-12">
      <div className="order-2 flex flex-col justify-center gap-4 p-6 sm:p-10 lg:order-1 lg:col-span-5">
        <Eyebrow post={post} prefix="New" />
        <h2 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-4xl sm:leading-[1.1]">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {post.title}
          </Link>
        </h2>
        {post.excerpt && <p className="text-base leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>}
        <p className="text-sm text-muted-foreground">Milos Knezevic · {metaLine(post)}</p>
      </div>
      <div className="relative order-1 lg:order-2 lg:col-span-7">
        <FrontCover post={post} sizes="(min-width: 1024px) 700px, 100vw" priority className="h-full" />
        <div className="absolute right-3 top-3 z-10 rounded-full bg-background/80 backdrop-blur">
          <SavePostButton postSlug={post.slug} iconOnly />
        </div>
      </div>
    </article>
  );
}

/**
 * A card for the grids: cover on top from tablet width up; on a phone a
 * compact row (text, small cover on the right) so a section is not a wall of
 * full-width pictures.
 */
export function FrontCard({ post, showExcerpt = false }: { post: FrontPostCard; showExcerpt?: boolean }) {
  return (
    <article className="group relative grid grid-cols-[minmax(0,1fr)_6.5rem] items-start gap-x-4 gap-y-2 border-b border-border pb-5 sm:flex sm:flex-col sm:gap-3 sm:border-0 sm:pb-0">
      <div className="relative col-start-2 row-span-3 row-start-1 sm:order-first">
        <FrontCover post={post} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 7rem" className="rounded-lg border border-border sm:rounded-2xl" />
        <div className="absolute right-2 top-2 z-10 hidden rounded-full bg-background/80 backdrop-blur sm:block">
          <SavePostButton postSlug={post.slug} iconOnly />
        </div>
      </div>
      <Eyebrow post={post} />
      <h3 className="text-base font-extrabold leading-snug text-foreground sm:text-lg">
        <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
          {post.title}
        </Link>
      </h3>
      {showExcerpt && post.excerpt && <p className="col-span-2 text-sm leading-relaxed text-muted line-clamp-2 sm:col-span-1">{post.excerpt}</p>}
      <p className="text-xs text-muted-foreground sm:mt-auto">{metaLine(post)}</p>
    </article>
  );
}

/** The two stories after the lead: cover beside the text on wide screens. */
export function SecondStory({ post }: { post: FrontPostCard }) {
  return (
    <article className="group relative grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-5">
      <FrontCover post={post} sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 7rem" className="order-2 rounded-lg sm:order-none sm:rounded-xl" />
      <div className="flex flex-col gap-2">
        <Eyebrow post={post} />
        <h3 className="text-base font-extrabold leading-snug text-foreground sm:text-lg">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-accent">
            {post.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">{metaLine(post)}</p>
      </div>
    </article>
  );
}
