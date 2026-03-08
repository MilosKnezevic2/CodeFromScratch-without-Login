import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PurchaseButton from "@/components/ebooks/PurchaseButton";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { slug } });
  if (!ebook) return { title: "Ebook not found" };

  return {
    title: `${ebook.title} | CodeFromScratch Ebooks`,
    description: ebook.description,
  };
}

export default async function EbookPage({ params }: PageProps) {
  const { slug } = await params;
  const ebook = await prisma.ebook.findUnique({ where: { slug } });

  if (!ebook || !ebook.published) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-col gap-8 sm:flex-row">
        {ebook.coverImageUrl && (
          <img
            src={ebook.coverImageUrl}
            alt={ebook.title}
            className="h-64 w-48 rounded-lg object-cover shadow-lg"
          />
        )}
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl font-bold text-foreground">{ebook.title}</h1>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-foreground">
              ${(ebook.price / 100).toFixed(2)}
            </span>
            {ebook.freeWithPro && (
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Free with Pro
              </span>
            )}
          </div>
          <p className="text-muted">{ebook.description}</p>
          <PurchaseButton
            ebookId={ebook.id}
            stripePriceId={ebook.stripePriceId}
            price={ebook.price}
            freeWithPro={ebook.freeWithPro}
          />
        </div>
      </div>
    </div>
  );
}
