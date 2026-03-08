import { getPostsByTag } from "@/lib/sanity/queries";
import Link from "next/link";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Tag: ${slug} | CodeFromScratch` };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const { posts } = await getPostsByTag(slug);

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-accent transition">
          &larr; All posts
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          #{slug}
        </h1>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts with this tag yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post._id}>
              <Link
                href={`/blog/${post.slug.current}`}
                className="card-glow block rounded-xl border border-border bg-surface p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="text-xl font-semibold text-foreground">{post.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </p>
                {post.excerpt && (
                  <p className="mt-3 text-muted line-clamp-2">{post.excerpt}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
