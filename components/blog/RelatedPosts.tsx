import Link from "next/link";
import { getRelatedPosts } from "@/lib/sanity/queries";

interface RelatedPostsProps {
  postId: string;
  categories: string[];
}

export default async function RelatedPosts({ postId, categories }: RelatedPostsProps) {
  const posts = await getRelatedPosts(postId, categories);

  if (posts.length === 0) return null;

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Related Posts</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/blog/${post.slug.current}`}
            className="card-glow rounded-lg border border-border bg-surface p-4 transition hover:-translate-y-0.5"
          >
            <h3 className="font-medium text-foreground line-clamp-2">{post.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
