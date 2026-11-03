"use server";

import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type DeleteState = { error?: string };

/**
 * Deletes the reader's account. The database removes their sign-in links,
 * sessions and comments with it (foreign keys cascade); a newsletter
 * subscription stays, unlinked, because it has its own consent and its own
 * one-click unsubscribe.
 */
export async function deleteAccountAction(_prev: DeleteState, form: FormData): Promise<DeleteState> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login?callbackUrl=/dashboard/account");
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    return { error: "Type delete to confirm." };
  }
  await prisma.user.delete({ where: { id } });
  await signOut({ redirectTo: "/?account=deleted" });
  return {};
}
