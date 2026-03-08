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

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });

  const isPro = subscription?.plan === "PRO" && subscription?.status === "ACTIVE";

  const freeEbooks = isPro
    ? await prisma.ebook.findMany({
        where: {
          freeWithPro: true,
          published: true,
          id: { notIn: purchases.map((p) => p.ebookId) },
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Ebooks</h1>

      {purchases.length === 0 && freeEbooks.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface/80 backdrop-blur-xl p-8 text-center">
          <p className="text-muted">No ebooks yet.</p>
          <Link href="/ebooks" className="mt-2 inline-block text-sm text-accent hover:text-teal-300">
            Browse ebook store
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {purchases.map(({ ebook }) => (
            <div
              key={ebook.id}
              className="card-glow flex items-center justify-between rounded-xl border border-border bg-surface/80 backdrop-blur-xl px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{ebook.title}</p>
                <p className="text-xs text-muted-foreground">Purchased</p>
              </div>
              <a
                href={`/api/user/ebooks/${ebook.id}/download`}
                className="cta-glow rounded-lg px-4 py-1.5 text-xs font-semibold"
              >
                Download
              </a>
            </div>
          ))}
          {freeEbooks.map((ebook) => (
            <div
              key={ebook.id}
              className="card-glow flex items-center justify-between rounded-xl border border-border bg-surface/80 backdrop-blur-xl px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{ebook.title}</p>
                <p className="text-xs text-accent">Included with Pro</p>
              </div>
              <a
                href={`/api/user/ebooks/${ebook.id}/download`}
                className="cta-glow rounded-lg px-4 py-1.5 text-xs font-semibold"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
