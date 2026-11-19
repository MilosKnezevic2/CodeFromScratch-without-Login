"use server";

import { revalidatePath } from "next/cache";
import { isAdminRequest } from "@/lib/admin-guard";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { toBody } from "@/lib/writer/body";
import { createSanityDraft } from "@/lib/writer/sanity";

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
 * Approves a draft: the article is created in Sanity first, unpublished, with
 * the author's profile, so it goes through the usual checks (category, cover
 * image) and the publish step in the Studio. Only when Sanity has it does the
 * draft count as approved; if Sanity fails, nothing changes and the editor
 * can press Approve again.
 */
export async function approveAction(id: string): Promise<ReviewResult> {
  if (!(await isAdminRequest())) return { ok: false, error: "Sign in to the admin again." };
  const draft = await prisma.articleDraft.findFirst({
    where: { id, status: "IN_REVIEW" },
    select: { id: true, title: true, excerpt: true, body: true, author: { select: { id: true, name: true } } },
  });
  if (!draft) return { ok: false, error: "This draft is not waiting for review any more." };
  try {
    await createSanityDraft({ id: draft.id, title: draft.title, excerpt: draft.excerpt, body: toBody(draft.body) }, draft.author);
  } catch (error) {
    console.error("writer: could not create the Sanity draft", error);
    return { ok: false, error: "Sanity did not accept the article, so nothing was approved. Try again in a minute." };
  }
  const { count } = await prisma.articleDraft.updateMany({
    where: { id, status: "IN_REVIEW" },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });
  if (count !== 1) return { ok: false, error: "This draft is not waiting for review any more." };
  await recordAudit("draft.approved", { id });
  revalidatePath("/portal-cfs-admin/drafts");
  return { ok: true };
}
