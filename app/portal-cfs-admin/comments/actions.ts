"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { notifyReplies } from "@/lib/reader/notify";

const PAGE = "/portal-cfs-admin/comments";

type Decision = "approve" | "reject" | "delete" | "ban";

/** Approves every comment in the queue at once, after the admin has looked through the list. */
export async function approveAllAction(): Promise<void> {
  if (!(await isAdminRequest())) return;
  const waiting = await prisma.postComment.findMany({ where: { status: "PENDING", deletedAt: null }, select: { id: true, reportedCount: true } });
  const { count } = await prisma.postComment.updateMany({
    where: { id: { in: waiting.map((c) => c.id) }, status: "PENDING" },
    data: { status: "APPROVED", reportedCount: 0 },
  });
  await recordAudit("comment.approve-all", { count });
  // Only replies published for the first time reach the person they answer.
  await notifyReplies(waiting.filter((c) => c.reportedCount === 0).map((c) => c.id));
  revalidatePath(PAGE);
}

/** One moderation decision on one comment. Every call checks the portal session itself. */
export async function moderateAction(form: FormData): Promise<void> {
  if (!(await isAdminRequest())) return;
  const id = String(form.get("id") ?? "");
  const decision = String(form.get("decision") ?? "") as Decision;
  const comment = await prisma.postComment.findUnique({ where: { id }, select: { id: true, userId: true, postSlug: true, status: true, reportedCount: true } });
  if (!comment) return;

  if (decision === "approve") {
    await prisma.postComment.update({ where: { id }, data: { status: "APPROVED", reportedCount: 0 } });
    // A reported comment put back is not news to anyone; a first publication is.
    if (comment.status === "PENDING" && comment.reportedCount === 0) await notifyReplies([id]);
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
