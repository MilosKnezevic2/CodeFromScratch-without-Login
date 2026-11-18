"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getEmailFrom, getResend } from "@/lib/resend";
import { createOwnDraft, currentAuthor, deleteOwnDraft, parseDraftInput, saveOwnDraft, submitOwnDraft } from "@/lib/writer/drafts";

export type WriterResult = { ok: true } | { ok: false; error: string };

const NOT_AUTHOR = { ok: false, error: "Your account cannot write here. Log in again with your author account." } as const;

/** Starts a new draft and opens it in the editor. */
export async function newDraftAction(): Promise<void> {
  const author = await currentAuthor();
  if (!author) redirect("/login?callbackUrl=/dashboard/write");
  const created = await createOwnDraft(author.id);
  if ("error" in created) redirect(`/dashboard/write?error=${encodeURIComponent(created.error)}`);
  redirect(`/write/${created.id}`);
}

/** Autosave from the editor. */
export async function saveDraftAction(id: string, raw: unknown): Promise<WriterResult> {
  const author = await currentAuthor();
  if (!author) return NOT_AUTHOR;
  const parsed = parseDraftInput(raw);
  if (!parsed.ok) return parsed;
  const saved = await saveOwnDraft(author.id, id, parsed.value);
  return saved ? { ok: true } : { ok: false, error: "This draft is with the editor now, so it cannot be changed." };
}

/** Sends the draft to the editor and tells the office; the author cannot edit it until the editor answers. */
export async function submitDraftAction(id: string): Promise<WriterResult> {
  const author = await currentAuthor();
  if (!author) return NOT_AUTHOR;
  const result = await submitOwnDraft(author.id, id);
  if ("error" in result) return { ok: false, error: result.error };
  try {
    await getResend().emails.send({
      from: getEmailFrom(),
      to: "office@codefromscratch.org",
      subject: `Draft for review: ${result.title}`,
      text: `${author.name ?? "An author"} sent "${result.title}" for review.\n\nRead it in the admin: https://codefromscratch.org/portal-cfs-admin/drafts/${id}`,
    });
  } catch (error) {
    // The draft is already in review and listed in the admin; only the email copy is lost.
    console.error("writer: review notification failed", error);
  }
  revalidatePath("/dashboard/write");
  return { ok: true };
}

/** Deletes a draft that was never sent. */
export async function deleteDraftAction(id: string): Promise<WriterResult> {
  const author = await currentAuthor();
  if (!author) return NOT_AUTHOR;
  const deleted = await deleteOwnDraft(author.id, id);
  if (!deleted) return { ok: false, error: "Only a draft that was never sent can be deleted." };
  revalidatePath("/dashboard/write");
  return { ok: true };
}
