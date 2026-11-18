"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export type ReviewResult = { ok: true } | { ok: false; error: string };

const NOTE_MAX = 5000;

/** Sends a draft back to its author with notes; the author can edit it again. */
export async function requestChangesAction(id: string, note: string): Promise<ReviewResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Sign in to the admin again." };
  const text = note.trim().slice(0, NOTE_MAX);
  if (text.length < 5) return { ok: false, error: "Write a short note so the author knows what to change." };
  const { count } = await prisma.articleDraft.updateMany({
    where: { id, status: "IN_REVIEW" },
    data: { status: "CHANGES_REQUESTED", reviewNote: text, reviewedAt: new Date() },
  });
  if (count !== 1) return { ok: false, error: "This draft is not waiting for review any more." };
  await recordAudit("draft.changes-requested", { id });
  revalidatePath("/portal-cfs-admin/drafts");
  return { ok: true };
}

/**
 * Approves a draft. In this prototype approval ends here; in the full version
 * the same button also creates the article in Sanity, unpublished, so it goes
 * through the usual checks and the publish step.
 */
export async function approveAction(id: string): Promise<ReviewResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Sign in to the admin again." };
  const { count } = await prisma.articleDraft.updateMany({
    where: { id, status: "IN_REVIEW" },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });
  if (count !== 1) return { ok: false, error: "This draft is not waiting for review any more." };
  await recordAudit("draft.approved", { id });
  revalidatePath("/portal-cfs-admin/drafts");
  return { ok: true };
}
