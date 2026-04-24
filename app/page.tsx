import Link from "next/link";
import Image from "next/image";
import NewsletterCTA from "@/components/newsletter/NewsletterCTA";
import { getPosts } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";

export default async function HomePage() {
  const { posts } = await getPosts(1, 4);

  return (
    <div>
      {/* Hero Section */}
      <section className="gradient-hero relative flex min-h-[90vh] items-center justify-center px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="animate-fade-up mb-4 text-sm font-medium uppercase tracking-widest text-accent">
            Welcome to CodeFromScratch
          </p>

          <h1 className="animate-fade-up delay-100 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Master{" "}
            <span className="gradient-text">Web Development</span>
            <br />
            From the Ground Up
          </h1>

          <p className="animate-fade-up delay-200 mx-auto mt-6 max-w-2xl text-lg text-muted">
            Hands-on tutorials, in-depth guides, and premium resources to take
            your development skills to the next level.
          </p>

          <div className="animate-fade-up delay-300 mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/blog"
              className="cta-glow rounded-lg px-8 py-3 text-sm font-semibold"
            >
              Start Reading
            </Link>
            <Link
              href="/newsletter"
              className="rounded-lg border border-border px-8 py-3 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              Join the Newsletter
            </Link>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
          {[
            { title: "No ads, no trackers", desc: "Just writing and code, respectfully." },
            { title: "Production-grade by default", desc: "Every article ships code you can read in your own repo." },
            { title: "Free to start, always", desc: "Core tutorials stay free. Premium goes deeper." },
          ].map((item) => (
            <div key={item.title} className="px-4 text-center sm:px-6">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="animate-fade-up text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Everything You Need to <span className="gradient-text">Level Up</span>
          </h2>
          <p className="mt-3 text-muted">
            From beginner tutorials to advanced deep-dives.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "In-Depth Tutorials",
              desc: "Step-by-step guides that don't skip the fundamentals.",
              icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
              delay: "delay-100",
              href: "/blog",
            },
            {
              title: "Premium Ebooks",
              desc: "Comprehensive references you can keep and revisit anytime.",
              icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
              delay: "delay-200",
              href: "/ebooks",
            },
            {
              title: "Structured Courses",
              desc: "Planned. Sign up for early access when the first course ships.",
              icon: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z",
              delay: "delay-300",
              href: "/courses",
            },
          ].map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className={`animate-fade-up ${feature.delay} card-glow rounded-xl border border-border bg-surface p-6 transition hover:border-accent/40`}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <svg
                  className="h-5 w-5 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Posts Section */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Latest <span className="gradient-text">Articles</span>
              </h2>
              <p className="mt-1 text-sm text-muted">Fresh tutorials and guides.</p>
            </div>
            <Link
              href="/blog"
              className="hidden text-sm font-medium text-accent transition hover:text-accent-2 sm:block"
            >
              View all articles &rarr;
            </Link>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {posts.slice(0, 4).map((post) => (
              <Link
                key={post._id}
                href={`/blog/${post.slug.current}`}
                className="group overflow-hidden rounded-xl border border-border bg-surface transition hover:border-accent/30 hover:shadow-lg"
              >
                {post.featuredImage?.asset && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <Image
                      src={urlFor(post.featuredImage).width(400).height(225).quality(80).url()}
                      alt={post.featuredImage.alt || post.title}
                      width={400}
                      height={225}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  {post.categories?.[0] && (
                    <span className="text-xs font-medium text-accent">
                      {post.categories[0].title}
                    </span>
                  )}
                  <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-foreground group-hover:text-accent transition">
                    {post.title}
                  </h3>
                  {post.readingTime && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {post.readingTime} min read
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/blog"
              className="text-sm font-medium text-accent transition hover:text-accent-2"
            >
              View all articles &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <NewsletterCTA />
      </div>
    </div>
  );
}
