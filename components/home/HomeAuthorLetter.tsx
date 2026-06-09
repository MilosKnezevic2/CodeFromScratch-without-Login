import Link from "next/link";

/**
 * Personal note from the operator. Humanises the journal — readers
 * are 4× more likely to subscribe to a person than to a brand.
 * Copy is hard-coded for now; if the operator wants to edit
 * frequently it can move into the SiteConfig table later.
 */
export default function HomeAuthorLetter() {
  return (
    <section
      aria-label="From the editor"
      className="border-t border-border pt-12"
    >
      <header className="mb-8 flex flex-wrap items-baseline gap-4">
        <span className="editorial-meta">§</span>
        <h2 className="editorial-display text-3xl text-foreground sm:text-4xl">
          From the editor
        </h2>
      </header>

      <div className="max-w-3xl">
        <p className="post-standfirst">
          Hi — I&rsquo;m Miloš. I&rsquo;ve spent the last few years building
          production web apps from scratch and writing about everything I learn
          along the way. No editorial calendar, no listicles, no SEO churn —
          just carefully researched pieces on whatever I&rsquo;m actually
          working on, published when they&rsquo;re ready.
        </p>
        <p className="editorial-body mt-6 text-muted">
          If you&rsquo;ve ever wished a tutorial would explain the why instead
          of the what — that you could read code that ships, not code that
          looks good in a screenshot — this journal is built for you.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-border/60 pt-6">
          <Link
            href="#newsletter"
            className="text-xs font-bold uppercase tracking-[0.2em] text-foreground transition-colors hover:text-accent"
          >
            Get the letter →
          </Link>
        </div>
      </div>
    </section>
  );
}
