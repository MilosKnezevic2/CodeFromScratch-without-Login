"use server";

import { revalidatePath } from "next/cache";
import { currentReader } from "@/lib/comments-store";
import { prisma } from "@/lib/prisma";
import { parseFolderName } from "@/lib/reader/rules";

export type FormResult = { error?: string; ok?: boolean };

/** Every action works only on the signed-in reader's own rows. */
async function readerId(): Promise<string | null> {
  return (await currentReader())?.id ?? null;
}

export async function renameFolderAction(_prev: FormResult, form: FormData): Promise<FormResult> {
  const id = await readerId();
  if (!id) return { error: "Log in again." };
  const parsed = parseFolderName(form.get("name"));
  if (!parsed.ok) return { error: parsed.error };
  const folderId = String(form.get("folderId") ?? "");
  const clash = await prisma.collection.findFirst({ where: { userId: id, name: parsed.name, NOT: { id: folderId } }, select: { id: true } });
  if (clash) return { error: "You already have a folder with that name." };
  await prisma.collection.updateMany({ where: { id: folderId, userId: id }, data: { name: parsed.name } });
  revalidatePath("/dashboard/saved");
  return { ok: true };
}

export async function createFolderAction(_prev: FormResult, form: FormData): Promise<FormResult> {
  const id = await readerId();
  if (!id) return { error: "Log in again." };
  const parsed = parseFolderName(form.get("name"));
  if (!parsed.ok) return { error: parsed.error };
  if ((await prisma.collection.count({ where: { userId: id } })) >= 30) return { error: "You can have up to 30 folders." };
  const clash = await prisma.collection.findFirst({ where: { userId: id, name: parsed.name }, select: { id: true } });
  if (clash) return { error: "You already have a folder with that name." };
  await prisma.collection.create({ data: { userId: id, name: parsed.name } });
  revalidatePath("/dashboard/saved");
  return { ok: true };
}

/** Deletes a folder; the articles in it stay saved. */
export async function deleteFolderAction(form: FormData): Promise<void> {
  const id = await readerId();
  if (!id) return;
  await prisma.collection.deleteMany({ where: { id: String(form.get("folderId") ?? ""), userId: id } });
  revalidatePath("/dashboard/saved");
}

export async function unsaveAction(form: FormData): Promise<void> {
  const id = await readerId();
  if (!id) return;
  await prisma.savedPost.deleteMany({ where: { userId: id, postSlug: String(form.get("slug") ?? "") } });
  revalidatePath("/dashboard/saved");
  revalidatePath("/dashboard");
}

/** Puts a saved article in a folder or takes it out. */
export async function setFolderAction(form: FormData): Promise<void> {
  const id = await readerId();
  if (!id) return;
  const savedPost = await prisma.savedPost.findFirst({ where: { userId: id, postSlug: String(form.get("slug") ?? "") }, select: { id: true } });
  const folder = await prisma.collection.findFirst({ where: { userId: id, id: String(form.get("folderId") ?? "") }, select: { id: true } });
  if (!savedPost || !folder) return;
  if (form.get("inFolder") === "true") {
    await prisma.savedPostCollection.upsert({
      where: { savedPostId_collectionId: { savedPostId: savedPost.id, collectionId: folder.id } },
      update: {},
      create: { savedPostId: savedPost.id, collectionId: folder.id },
    });
  } else {
    await prisma.savedPostCollection.deleteMany({ where: { savedPostId: savedPost.id, collectionId: folder.id } });
  }
  revalidatePath("/dashboard/saved");
}

export async function setTrackingAction(form: FormData): Promise<void> {
  const id = await readerId();
  if (!id) return;
  await prisma.user.update({ where: { id }, data: { trackReading: form.get("track") === "on" } });
  revalidatePath("/dashboard/reading");
  revalidatePath("/dashboard");
}

export async function clearHistoryAction(): Promise<void> {
  const id = await readerId();
  if (!id) return;
  await prisma.readingHistory.deleteMany({ where: { userId: id } });
  revalidatePath("/dashboard/reading");
  revalidatePath("/dashboard");
}
