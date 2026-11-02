import ReadingCard from "./ReadingCard";
import type { ReadingPick } from "@/lib/blog/keep-reading";

/**
 * Three articles to read next, after the article, each with the reason it is
 * there. Every reader reaches this; the old side column of titles showed only
 * on screens wider than 1536 px.
 */
export default function KeepReading({ picks }: { picks: ReadingPick[] }) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="keep-reading-heading" className="mt-16 border-t border-border pt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="keep-reading-heading" className="text-2xl font-bold tracking-tight text-foreground">
          Keep reading
        </h2>
        <p className="text-sm text-muted-foreground">Picked for this article</p>
      </div>
      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((post) => (
          <li key={post._id}>
            <ReadingCard post={post} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}
