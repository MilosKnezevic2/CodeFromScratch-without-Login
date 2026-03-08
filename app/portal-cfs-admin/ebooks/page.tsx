import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export default async function AdminEbooksPage() {
  await requireAdmin();

  const ebooks = await prisma.ebook.findMany({
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Ebooks</h1>
      <p className="text-sm text-muted">
        Manage ebooks via Sanity Studio. This page shows sync status and sales data.
      </p>

      {ebooks.length === 0 ? (
        <p className="text-muted-foreground">No ebooks in the database yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="px-4 py-2 font-medium text-muted">Title</th>
                <th className="px-4 py-2 font-medium text-muted">Price</th>
                <th className="px-4 py-2 font-medium text-muted">Sales</th>
                <th className="px-4 py-2 font-medium text-muted">Published</th>
                <th className="px-4 py-2 font-medium text-muted">Free w/Pro</th>
              </tr>
            </thead>
            <tbody>
              {ebooks.map((ebook) => (
                <tr key={ebook.id} className="border-b border-border">
                  <td className="px-4 py-2 font-medium text-foreground">{ebook.title}</td>
                  <td className="px-4 py-2 text-muted">${(ebook.price / 100).toFixed(2)}</td>
                  <td className="px-4 py-2 text-muted">{ebook._count.purchases}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs ${
                      ebook.published ? "bg-accent/10 text-accent" : "bg-surface-3 text-muted"
                    }`}>
                      {ebook.published ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-muted">{ebook.freeWithPro ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
