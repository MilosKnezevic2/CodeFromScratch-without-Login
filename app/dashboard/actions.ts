"use server";

import { revalidatePath } from "next/cache";
import { currentReader } from "@/lib/comments-store";
import { prisma } from "@/lib/prisma";
import {
  isFolderColor,
  isSlug,
  MAX_FOLDERS,
  nextFolderColor,
  parseDisplayName,
  parseFolderName,
  parseGoal,
} from "@/lib/reader/rules";

export type ActionResult = { ok: true } | { ok: false; error: string };
export type FolderResult = { ok: true; folder: { id: string; name: string; color: string } } | { ok: false; error: string };

const SIGNED_OUT = { ok: false, error: "Log in again." } as const;

/** Every action works only on the signed-in reader's own rows. */
async function readerId(): Promise<string | null> {
  return (await currentReader())?.id ?? null;
}

function refreshDesk(): void {
  revalidatePath("/dashboard", "layout");
}

export async function createFolder(name: unknown): Promise<FolderResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  const parsed = parseFolderName(name);
  if (!parsed.ok) return parsed;
  const existing = await prisma.collection.findMany({ where: { userId: id }, select: { name: true, color: true } });
  if (existing.length >= MAX_FOLDERS) return { ok: false, error: `You can have up to ${MAX_FOLDERS} folders.` };
  if (existing.some((f) => f.name === parsed.name)) return { ok: false, error: "You already have a folder with that name." };
  const folder = await prisma.collection.create({
    data: { userId: id, name: parsed.name, color: nextFolderColor(existing.map((f) => f.color)) },
    select: { id: true, name: true, color: true },
  });
  refreshDesk();
  return { ok: true, folder };
}

export async function updateFolder(folderId: string, change: { name?: unknown; color?: unknown }): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  const data: { name?: string; color?: string } = {};
  if (change.name !== undefined) {
    const parsed = parseFolderName(change.name);
    if (!parsed.ok) return parsed;
    const clash = await prisma.collection.findFirst({ where: { userId: id, name: parsed.name, NOT: { id: folderId } }, select: { id: true } });
    if (clash) return { ok: false, error: "You already have a folder with that name." };
    data.name = parsed.name;
  }
  if (change.color !== undefined) {
    if (!isFolderColor(change.color)) return { ok: false, error: "Pick one of the colours." };
    data.color = change.color;
  }
  await prisma.collection.updateMany({ where: { id: folderId, userId: id }, data });
  refreshDesk();
  return { ok: true };
}

/** Deletes a folder; the articles in it stay saved. */
export async function deleteFolder(folderId: string): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  await prisma.collection.deleteMany({ where: { id: folderId, userId: id } });
  refreshDesk();
  return { ok: true };
}

/** Puts a saved article in a folder or takes it out. */
export async function fileArticle(slug: string, folderId: string, inFolder: boolean): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  const [savedPost, folder] = await Promise.all([
    prisma.savedPost.findFirst({ where: { userId: id, postSlug: slug }, select: { id: true } }),
    prisma.collection.findFirst({ where: { userId: id, id: folderId }, select: { id: true } }),
  ]);
  if (!savedPost || !folder) return { ok: false, error: "That article or folder is gone. Reload the page." };
  if (inFolder) {
    await prisma.savedPostCollection.upsert({
      where: { savedPostId_collectionId: { savedPostId: savedPost.id, collectionId: folder.id } },
      update: {},
      create: { savedPostId: savedPost.id, collectionId: folder.id },
    });
  } else {
    await prisma.savedPostCollection.deleteMany({ where: { savedPostId: savedPost.id, collectionId: folder.id } });
  }
  refreshDesk();
  return { ok: true };
}

export async function removeSaved(slug: string): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  await prisma.savedPost.deleteMany({ where: { userId: id, postSlug: slug } });
  refreshDesk();
  return { ok: true };
}

/** For an article read elsewhere (or before tracking was on): counts it as read now. */
export async function markRead(slug: string): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  if (!isSlug(slug)) return { ok: false, error: "Not found." };
  const now = new Date();
  await prisma.readingHistory.upsert({
    where: { userId_postSlug: { userId: id, postSlug: slug } },
    create: { userId: id, postSlug: slug, scrollPercent: 100, lastPercent: 100, completedAt: now },
    update: { scrollPercent: 100, lastPercent: 100, readAt: now },
  });
  await prisma.readingHistory.updateMany({ where: { userId: id, postSlug: slug, completedAt: null }, data: { completedAt: now } });
  refreshDesk();
  return { ok: true };
}

export async function setTracking(on: boolean): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  await prisma.user.update({ where: { id }, data: { trackReading: on } });
  refreshDesk();
  return { ok: true };
}

export async function clearHistory(): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  await prisma.$transaction([prisma.readingHistory.deleteMany({ where: { userId: id } }), prisma.readingDay.deleteMany({ where: { userId: id } })]);
  refreshDesk();
  return { ok: true };
}

export async function setDisplayName(name: unknown): Promise<ActionResult & { name?: string }> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  const parsed = parseDisplayName(name);
  if (!parsed.ok) return parsed;
  await prisma.user.update({ where: { id }, data: { name: parsed.name } });
  refreshDesk();
  return { ok: true, name: parsed.name };
}

export async function setGoal(goal: unknown): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  const value = parseGoal(goal);
  if (value === null) return { ok: false, error: "Pick between 1 and 7 articles a week." };
  await prisma.user.update({ where: { id }, data: { weeklyGoal: value } });
  refreshDesk();
  return { ok: true };
}

/** The two opt-in emails; both start off. */
export async function setEmailChoice(kind: "replies" | "reminder", on: boolean): Promise<ActionResult> {
  const id = await readerId();
  if (!id) return SIGNED_OUT;
  await prisma.user.update({ where: { id }, data: kind === "replies" ? { notifyReplies: on } : { weeklyReminder: on } });
  refreshDesk();
  return { ok: true };
}
