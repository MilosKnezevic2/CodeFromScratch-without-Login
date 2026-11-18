import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { STATUS_LABEL } from "@/lib/writer/status";

export const metadata: Metadata = {
  title: "Drafts",
  robots: { index: false, follow: false },
};

const when = (d: Date) => d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Guest authors' articles that reached the editor. Drafts still being written stay private to their author. */
export default async function AdminDraftsPage() {
  if (!(await isAdminRequest())) redirect("/portal-cfs-admin/login");
  const drafts = await prisma.articleDraft.findMany({
    where: { status: { not: "WRITING" } },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    take: 100,
    select: { id: true, title: true, status: true, submittedAt: true, author: { select: { name: true, email: true } } },
  });
  const waiting = drafts.filter((d) => d.status === "IN_REVIEW").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Drafts from authors</h1>
        <p className="mt-1 text-sm text-muted">
          {waiting === 0 ? "Nothing waits for your review." : `${waiting} waiting for your review.`} Authors write in their own
          desk; you see a draft once they send it.
        </p>
      </div>
      {drafts.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">No draft has been sent yet.</p>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d) => {
            const status = STATUS_LABEL[d.status];
            return (
              <li key={d.id}>
                <Link
                  href={`/portal-cfs-admin/drafts/${d.id}`}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{d.title || "Untitled article"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {d.author.name ?? d.author.email} · sent {d.submittedAt ? when(d.submittedAt) : "–"}
                    </p>
                  </div>
                  <span className={`shrink-0 self-start rounded-full px-3 py-1 text-xs font-bold sm:self-center ${status.tone}`}>{status.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
