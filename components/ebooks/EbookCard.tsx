import Link from "next/link";

interface EbookCardProps {
  ebook: {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverImageUrl: string | null;
    price: number;
    freeWithPro: boolean;
  };
}

export default function EbookCard({ ebook }: EbookCardProps) {
  return (
    <Link
      href={`/ebooks/${ebook.slug}`}
      className="group rounded-xl border border-border bg-surface shadow-sm transition hover:shadow-md"
    >
      {ebook.coverImageUrl && (
        <img
          src={ebook.coverImageUrl}
          alt={ebook.title}
          className="h-48 w-full rounded-t-xl object-cover"
        />
      )}
      <div className="p-4">
        <h3 className="font-semibold text-foreground group-hover:text-indigo-600">
          {ebook.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
          {ebook.description}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            ${(ebook.price / 100).toFixed(2)}
          </span>
          {ebook.freeWithPro && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Free with Pro
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
