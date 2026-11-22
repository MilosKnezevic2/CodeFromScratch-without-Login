"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { isMessageId } from "@/lib/contact-inbox";
import { prisma } from "@/lib/prisma";

const PAGE = "/portal-cfs-admin/contacts";

export type Change = "unread" | "replied" | "unreplied" | "archive" | "unarchive" | "delete";

/** What each button changes. Filing or answering a message also counts as having read it. */
function changeData(change: string, now: Date) {
  switch (change) {
    case "unread":
      return { read: false };
    case "replied":
      return { read: true, repliedAt: now };
    case "unreplied":
      return { repliedAt: null };
    case "archive":
      return { read: true, archivedAt: now };
    case "unarchive":
      return { archivedAt: null };
    default:
      return null;
  }
}

/** Opening a message marks it read. Called by the page itself, so nothing is audited or re-rendered. */
export async function markReadAction(id: string): Promise<void> {
  if (!isMessageId(id) || !(await isAdminRequest())) return;
  await prisma.contactSubmission.updateMany({ where: { id, read: false }, data: { read: true } });
}

/** One change to one message. Every call checks the portal session itself. */
export async function changeMessageAction(id: string, change: Change): Promise<void> {
  if (!isMessageId(id) || !(await isAdminRequest())) return;
  if (change === "delete") {
    const { count } = await prisma.contactSubmission.deleteMany({ where: { id } });
    if (count) await recordAudit("contact.delete", { ref: id });
  } else {
    const data = changeData(change, new Date());
    if (!data) return;
    const { count } = await prisma.contactSubmission.updateMany({ where: { id }, data });
    if (count) await recordAudit(`contact.${change}`, { ref: id });
  }
  revalidatePath(PAGE);
  revalidatePath("/portal-cfs-admin");
}

/** Clears every "New" label in the inbox at once. */
export async function markAllReadAction(): Promise<void> {
  if (!(await isAdminRequest())) return;
  const { count } = await prisma.contactSubmission.updateMany({ where: { read: false, archivedAt: null }, data: { read: true } });
  if (count) await recordAudit("contact.read-all", { count });
  revalidatePath(PAGE);
  revalidatePath("/portal-cfs-admin");
}
