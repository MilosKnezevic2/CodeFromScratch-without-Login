import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import EbookNotifyForm from "@/components/ebooks/EbookNotifyForm";

export const metadata: Metadata = {
  title: "Ebooks | CodeFromScratch",
  description: "Premium web development ebooks with practical examples and real-world projects.",
};

export default async function EbooksPage() {
  const ebooks = await prisma.ebook.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  const hasEbooks = ebooks.length > 0;

  return (
    <div>
      {/* Hero */}
      <section className="relative px-4 pb-12 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            Ebooks
          </p>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
            Deep-Dive <span className="gradient-text">Resources</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
            Comprehensive guides packed with practical examples, real-world projects, and everything you need to level up.
          </p>
        </div>
      </section>

      {hasEbooks ? (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ebooks.map((ebook) => (
              <Link
                key={ebook.id}
                href={`/ebooks/${ebook.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:border-accent/30 hover:shadow-lg"
              >
                {ebook.coverImageUrl && (
                  <div className="aspect-[3/4] max-h-64 overflow-hidden bg-surface-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- `coverImageUrl` is an admin-uploaded URL that may point to any host; next/image requires every host to be whitelisted in next.config.ts. A host strategy for ebook covers is a Phase 5 architecture decision. */}
                    <img
                      src={ebook.coverImageUrl}
                      alt={ebook.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                {!ebook.coverImageUrl && (
                  <div className="flex aspect-[3/4] max-h-64 items-center justify-center bg-gradient-to-br from-accent/10 to-accent-2/10">
                    <svg className="h-16 w-16 text-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition">
                    {ebook.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                    {ebook.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xl font-extrabold text-foreground">
                      ${(ebook.price / 100).toFixed(2)}
                    </span>
                    {ebook.freeWithPro && (
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-accent">
                        Free with Pro+
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        /* Fallback: Coming Soon with notify form */
        <section className="flex min-h-[40dvh] items-center justify-center px-4 py-16">
          <div className="mx-auto max-w-lg text-center">
            <p className="text-muted">
              We&apos;re crafting comprehensive web development ebooks. Be the first to know when they launch.
            </p>
            <div className="mt-8">
              <EbookNotifyForm />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
