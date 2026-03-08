import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EbooksPage() {
  const user = await requireAuth();

  const purchases = await prisma.ebookPurchase.findMany({
    where: { userId: user.id },
    include: { ebook: true },
    orderBy: { createdAt: "desc" },
  });

  const subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  const isPro = subscription?.plan === "PRO" && subscription?.status === "ACTIVE";

  const freeEbooks = isPro
    ? await prisma.ebook.findMany({
        where: { freeWithPro: true, published: true, id: { notIn: purchases.map((p) => p.ebookId) } },
      })
    : [];

  const allEbooks = [
    ...purchases.map(({ ebook }) => ({ ...ebook, type: "purchased" as const })),
    ...freeEbooks.map((ebook) => ({ ...ebook, type: "pro" as const })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
            <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">My Ebooks</h1>
            <p className="text-xs text-muted-foreground">{allEbooks.length} {allEbooks.length === 1 ? "ebook" : "ebooks"} in your library</p>
          </div>
        </div>
        <Link href="/ebooks" className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:border-accent/30 hover:text-accent">
          Browse Store
        </Link>
      </div>

      {allEbooks.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2">
            <svg className="h-7 w-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground">No ebooks yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Browse our store to find your first ebook.</p>
          <Link href="/ebooks" className="gradient-btn mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold">
            Browse Ebooks
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {allEbooks.map((ebook) => (
            <div
              key={ebook.id}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 transition hover:border-accent/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{ebook.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ebook.type === "pro" ? (
                    <span className="inline-flex items-center gap-1 text-accent">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                      Included with Pro
                    </span>
                  ) : (
                    "Purchased"
                  )}
                </p>
              </div>
              <a
                href={`/api/user/ebooks/${ebook.id}/download`}
                className="flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2 text-xs font-bold text-accent transition hover:bg-accent/10"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
