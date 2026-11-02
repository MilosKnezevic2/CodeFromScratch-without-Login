"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const PAGE = "/portal-cfs-admin/comments";

type Decision = "approve" | "reject" | "delete" | "ban";

/** Approves every comment in the queue at once, after the admin has looked through the list. */
export async function approveAllAction(): Promise<void> {
  if (!(await isAdminRequest())) return;
  const { count } = await prisma.postComment.updateMany({
    where: { status: "PENDING", deletedAt: null },
    data: { status: "APPROVED", reportedCount: 0 },
  });
  await recordAudit("comment.approve-all", { count });
  revalidatePath(PAGE);
}

/** One moderation decision on one comment. Every call checks the portal session itself. */
export async function moderateAction(form: FormData): Promise<void> {
  if (!(await isAdminRequest())) return;
  const id = String(form.get("id") ?? "");
  const decision = String(form.get("decision") ?? "") as Decision;
  const comment = await prisma.postComment.findUnique({ where: { id }, select: { id: true, userId: true, postSlug: true } });
  if (!comment) return;

  if (decision === "approve") {
    await prisma.postComment.update({ where: { id }, data: { status: "APPROVED", reportedCount: 0 } });
  } else if (decision === "reject") {
    await prisma.postComment.update({ where: { id }, data: { status: "REJECTED" } });
  } else if (decision === "delete") {
    await prisma.postComment.update({ where: { id }, data: { deletedAt: new Date() } });
  } else if (decision === "ban") {
    // The reader is signed out on their next request and cannot sign in again; their comments leave the page.
    await prisma.$transaction([
      prisma.user.update({ where: { id: comment.userId }, data: { banned: true } }),
      prisma.postComment.updateMany({ where: { userId: comment.userId, status: { in: ["PENDING", "APPROVED"] } }, data: { status: "SPAM" } }),
    ]);
  } else {
    return;
  }
  await recordAudit(`comment.${decision}`, { ref: comment.id, section: comment.postSlug });
  revalidatePath(PAGE);
}
