import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { wordCount } from "@/lib/writer/markdown";
import { STATUS_LABEL } from "@/lib/writer/status";
import DraftPreview from "@/components/writer/DraftPreview";
import ReviewPanel from "./ReviewPanel";

export const metadata: Metadata = {
  title: "Review draft",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

/** One sent draft: the article as readers will see it, and the decision. */
export default async function AdminDraftPage({ params }: Props) {
  if (!(await isAdminRequest())) redirect("/portal-cfs-admin/login");
  const draft = await prisma.articleDraft.findFirst({
    where: { id: (await params).id, status: { not: "WRITING" } },
    include: { author: { select: { name: true, email: true } } },
  });
  if (!draft) notFound();
  const status = STATUS_LABEL[draft.status];

  return (
    <div className="space-y-6">
      <Link href="/portal-cfs-admin/drafts" className="text-sm text-muted hover:text-foreground">
        ← All drafts
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span>
        <span className="text-sm text-muted">
          by {draft.author.name ?? draft.author.email} · {wordCount(draft.markdown).toLocaleString("en-GB")} words
        </span>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <DraftPreview title={draft.title} excerpt={draft.excerpt} markdown={draft.markdown} authorName={draft.author.name ?? "Author"} />
        <ReviewPanel id={draft.id} status={draft.status} reviewNote={draft.reviewNote} />
      </div>
    </div>
  );
}
