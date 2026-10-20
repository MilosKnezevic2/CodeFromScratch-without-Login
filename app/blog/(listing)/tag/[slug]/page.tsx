import { getPostsByTag, getTagsWithCategory } from "@/lib/sanity/queries";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { urlFor } from "@/lib/sanity/image";
import FadeUp from "@/components/animations/FadeUp";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codefromscratch.org";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // A metadata-phase throw bypasses error.tsx — swallow it so the page
  // render throws instead and readers get the branded error boundary.
  let tags: Awaited<ReturnType<typeof getTagsWithCategory>>;
  try {
    tags = await getTagsWithCategory();
  } catch {
    return { title: "Tag temporarily unavailable" };
  }
  const tag = tags.find((t) => t.slug.current === slug);
  if (!tag) return { title: "Tag not found" };
  return {
    // Bare title — the root layout template appends "| CodeFromScratch";
    // the tag's real title, not the raw slug.
    title: `#${tag.title}`,
    description: `Browse all articles tagged with #${tag.title}.`,
    alternates: { canonical: `${SITE_URL}/blog/tag/${slug}` },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tags = await getTagsWithCategory();
  const tag = tags.find((t) => t.slug.current === slug);
  // A real 404 for made-up slugs — an empty "0 posts" page with HTTP 200
  // reads as a soft-404 and invites unlimited thin URLs into the index.
  if (!tag) notFound();
  const { posts } = await getPostsByTag(slug);

  return (
    <div>
      {/* Hero header */}
      <section className="blog-hero-mesh relative overflow-hidden bg-background px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <FadeUp>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-accent"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              All posts
            </Link>
          </FadeUp>
          <FadeUp delay={0.05}>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                <span className="gradient-text">#</span>{tag.title}
              </h1>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-2">
              <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m0 0l2.25 2.25M9.75 15l2.25-2.25M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg text-muted-foreground">No posts with this tag yet.</p>
            <Link href="/blog" className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
              Browse all posts
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <FadeUp key={post._id} delay={0.05 * i}>
                <Link
                  href={`/blog/${post.slug.current}`}
                  className="blog-card group flex h-full flex-col rounded-2xl"
                  style={{ borderRadius: "1rem", overflow: "hidden" }}
                >
                  {/* Image */}
                  <div className="img-shine relative aspect-[1200/630] w-full overflow-hidden" style={{ borderTopLeftRadius: "1rem", borderTopRightRadius: "1rem" }}>
                    {post.featuredImage?.asset ? (
                      <Image
                        src={urlFor(post.featuredImage).width(800).quality(80).url()}
                        alt={post.featuredImage.alt || post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/10 via-surface to-accent-2/10">
                        <svg className="h-12 w-12 text-accent/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" />
                    {/* PRO badge hidden during the unpaid phase. */}
                    {post.readingTime && (
                      <span className="glass-pill absolute left-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium text-white">
                        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {post.readingTime} min
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-5">
                    {post.categories && post.categories.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {post.categories.slice(0, 2).map((cat) => (
                          <span key={cat.slug.current} className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                            {cat.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="hover-underline inline text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-accent line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-2">
                        {post.author && (
                          <>
                            {post.author.image?.asset ? (
                              <Image
                                src={urlFor(post.author.image).width(28).height(28).url()}
                                alt={post.author.name}
                                width={20}
                                height={20}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent">
                                {post.author.name.charAt(0)}
                              </span>
                            )}
                            <span className="text-xs font-medium text-muted-foreground">{post.author.name}</span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
